import path from 'path';
import readDir from 'fs-readdir-recursive';
import g2js from 'gradle-to-js/lib/parser';
import fs from 'fs-extra';
import Mustache from 'mustache';
import log from './log';

const template = `package com.walmartlabs.ern.container.plugins;

import android.app.Application;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;

import com.facebook.react.ReactPackage;
import {{fullyQualifiedPackageClassName}};

public class {{packageClassName}}Plugin implements ReactPlugin {
    public ReactPackage hook(@NonNull Application application, @Nullable ReactPluginConfig config) {
        return new {{packageClassName}}();
    }
}
`;

export class AndroidPluginConfigGenerator {
  public static fromPath(p: string) {
    return new AndroidPluginConfigGenerator(p);
  }

  public readonly root: string;
  public readonly files: string[];

  private readonly excludedDirectoriesRe = new RegExp(/sample|demo|example/i);
  private readonly exclusions: string[] = [
    'com.facebook.react:react-native',
    'fileTree(include',
  ];

  private constructor(p: string) {
    this.root = p;
    this.files = readDir(p, x => !this.excludedDirectoriesRe.test(x));
  }

  public async generateConfig({
    revolveBuildGradlePath,
    resolveDependencyVersion,
  }: {
    revolveBuildGradlePath: (buildGradlePaths: string[]) => Promise<string>;
    resolveDependencyVersion: (dependency: string) => Promise<string>;
  }): Promise<any> {
    if (!this.doesPluginSupportAndroid) {
      throw new Error('No Android project found');
    }
    const config: any = {};
    let buildGradlePath = this.gradlePaths[0];
    if (this.gradlePaths.length > 1) {
      if (this.androidManifestPaths.length > 1) {
        buildGradlePath = await revolveBuildGradlePath(this.gradlePaths);
      } else {
        const manifestPath = this.androidManifestPaths[0];
        // find build.gradle path closest to AndroidManifest.xml
        let p = path.dirname(manifestPath);
        while (p !== '.') {
          if (this.gradlePaths.map(path.dirname).includes(p)) {
            buildGradlePath = path.join(p, 'build.gradle');
            break;
          }
          p = path.dirname(p);
        }
      }
    }

    config.root = path.dirname(buildGradlePath);
    config.dependencies = await this.getDependenciesFromBuildGradle(
      path.join(this.root, buildGradlePath),
      resolveDependencyVersion,
    );

    return config;
  }

  public get doesPluginSupportAndroid() {
    return this.gradlePaths.length > 0;
  }

  public async getDependenciesFromBuildGradle(
    p: string,
    resolveDependencyVersion: (dependency: string) => Promise<string>,
  ) {
    const parsed: any = await g2js.parseFile(p);
    const res = await Promise.all(
      parsed.dependencies
        .filter((x: any) => !/testImplementation|testCompile/.test(x.type))
        .filter((x: any) => !this.exclusions.includes(`${x.group}:${x.name}`))
        .filter((x: any) => !this.exclusions.some(y => x.name.includes(y)))
        .map(async (x: any) => {
          if (x.group) {
            return `${x.group}:${x.name}:${x.version}`;
          } else {
            // Handle this kind of string where version is dynamically retrieved
            // "com.android.support:exifinterface:${safeExtGet('supportLibVersion', '28.0.0')}"
            const match = x.name.replace('"', '').match(/^(.+):(.+):(.+)/);
            if (match) {
              const [, group, name, version] = match;
              const versionMatch = version.match(/\d+.\d+.\d+/);
              if (versionMatch) {
                return `${group}:${name}:${versionMatch[0]}`;
              } else {
                // Handle this kind of string where version cannot be found inline
                // com.google.android.gms:play-services-vision:$googlePlayServicesVisionVersion
                const resolvedVersion = await resolveDependencyVersion(
                  `${group}:${name}`,
                );
                return `${group}:${name}:${resolvedVersion}`;
              }
            }
            log.debug(`Ignoring ${x.name}`);
            return '';
          }
        }),
    );
    return res.filter((x: string) => x !== '');
  }

  public async generatePluginJavaSource(): Promise<any> {
    const packageImpl = await this.findReactPackageImplementationFile();
    const absPath = path.join(this.root, packageImpl);
    const packageName = await this.getJavaPackageDeclarationFromSource(absPath);
    const packageClassName = await this.getClassNameFromSource(absPath);
    const fullyQualifiedPackageClassName = `${packageName}.${packageClassName}`;

    if (await this.hasNonDefaultConstructor(absPath, packageClassName)) {
      if (!(await this.hasDefaultConstructor(absPath, packageClassName))) {
        throw new Error(
          `Non default constructors found in ${packageClassName} class.
${packageImpl}.
A Configurable Plugin implementation might be required.
Automated Configurable Plugin generation is not yet supported`,
        );
      } else {
        log.warn(`Non default constructors detected.
It might be needed to manually update the plugin config to make it a configurable plugin.`);
      }
    }

    return {
      content: Mustache.render(template, {
        fullyQualifiedPackageClassName,
        packageClassName,
      }),
      filename: `${packageClassName}Plugin.java`,
    };
  }

  public async findReactPackageImplementationFile(): Promise<string> {
    let candidates = this.files.filter(x => x.endsWith('Package.java'));
    let result;
    if (candidates.length === 0) {
      candidates = this.files.filter(x => x.endsWith('.java'));
    }
    for (const candidate of candidates) {
      const content = await fs.readFile(path.join(this.root, candidate));
      if (/implements ReactPackage/.test(content.toString())) {
        // Found it ! Unless there are multiple ReactPackage impls
        // Should check if that's the case and fail
        result = candidate;
      }
    }
    if (!result) {
      throw new Error('ReactPackage implementation not found');
    }
    return result;
  }

  public async getJavaPackageDeclarationFromSource(p: string): Promise<string> {
    const content = await fs.readFile(p);
    const match = content.toString().match(/package (.+);/);
    if (!match) {
      throw new Error(`No package declaration found in ${p}`);
    }
    return match[1];
  }

  public async getClassNameFromSource(p: string): Promise<string> {
    const content = await fs.readFile(p);
    const match = content
      .toString()
      .match(/class (.+) implements ReactPackage/);
    if (!match) {
      throw new Error(`No class implementing ReactPackage found in ${p}`);
    }
    return match[1];
  }

  public async hasDefaultConstructor(
    p: string,
    className: string,
  ): Promise<boolean> {
    const content = await fs.readFile(p);
    const re = new RegExp(`public ${className}\\((\\t*|\\s*)\\)`, 'g');
    return re.test(content.toString());
  }

  public async hasNonDefaultConstructor(
    p: string,
    className: string,
  ): Promise<any | null> {
    const content = await fs.readFile(p);
    const re = new RegExp(`public ${className}\\(\\S+`, 'g');
    const match = content.toString().match(re);
    return match && match.length > 0;
  }

  get gradlePaths(): string[] {
    return this.files.filter(x => x.endsWith('build.gradle'));
  }

  get androidManifestPaths(): string[] {
    return this.files.filter(x => x.endsWith('AndroidManifest.xml'));
  }
}
