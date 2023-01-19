import path from 'path';
import readDir from 'fs-readdir-recursive';
import g2js from 'gradle-to-js/lib/parser';
import fs from 'fs-extra';
import Mustache from 'mustache';
import log from './log';

const template = `package com.walmartlabs.ern.container.plugins;

import android.app.Application;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.ReactPackage;
import {{packageName}}.{{className}};

public class {{className}}Plugin implements ReactPlugin {
    @Override
    public ReactPackage hook(@NonNull Application application, @Nullable ReactPluginConfig config) {
        return new {{className}}();
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
    'fileTree(',
  ];

  private constructor(p: string) {
    this.root = p;
    this.files = readDir(p, (x) => !this.excludedDirectoriesRe.test(x));
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
    // A bug in g2js can result in issues parsing the dependencies block
    // Details: https://github.com/ninetwozero/gradle-to-js/issues/32
    // TODO: Remove after the issue has been fixed in gradle-to-js
    if (!parsed.dependencies && parsed.buildscript) {
      parsed.dependencies = parsed.buildscript.dependencies;
    }
    const res = await Promise.all(
      parsed.dependencies
        .filter((x: any) => !/testImplementation|testCompile/.test(x.type))
        .filter((x: any) => !this.exclusions.includes(`${x.group}:${x.name}`))
        .filter((x: any) => !this.exclusions.some((y) => x.name.includes(y)))
        .map(async (x: any) => {
          if (x.group) {
            return `${x.type} '${x.group}:${x.name}:${x.version}'`;
          } else {
            // Handle this kind of string where version is dynamically retrieved
            // "com.android.support:exifinterface:${safeExtGet('supportLibVersion', '28.0.0')}"
            const match = x.name.replace('"', '').match(/^(.+):(.+):(.+)/);
            if (match) {
              const [, group, name, version] = match;
              const versionMatch = version.match(/\d+.\d+.\d+/);
              if (versionMatch) {
                return `${x.type} '${group}:${name}:${versionMatch[0]}'`;
              } else {
                // Handle this kind of string where version cannot be found inline
                // com.google.android.gms:play-services-vision:$googlePlayServicesVisionVersion
                const resolvedVersion = await resolveDependencyVersion(
                  `${group}:${name}`,
                );
                return `${x.type} '${group}:${name}:${resolvedVersion}'`;
              }
            }
            log.debug(`Ignoring ${x.name}`);
            return '';
          }
        }),
    );
    return res.filter((x: string) => x !== '');
  }

  public async generatePluginSource() {
    const impls = await this.findReactPackageImplementations();
    if (impls.length === 0) {
      throw new Error('ReactPackage implementation not found');
    }
    if (impls.length > 1) {
      log.warn(
        'Multiple ReactPackage impls detected. Manually verify the generated plugin and make modifications as necessary.',
      );
    }
    log.info(`Using ReactPackage from: ${impls[0].file}`);
    log.debug(JSON.stringify(impls[0], null, 2));

    return {
      content: Mustache.render(template, impls[0]),
      filename: `${impls[0].className}Plugin.java`,
    };
  }

  public async findReactPackageImplementations() {
    const results = [];
    let files = this.files.filter((x) => /Package.(java|kt)$/.test(x));
    if (files.length === 0) {
      files = this.files.filter((x) => /.(java|kt)$/.test(x));
    }
    for (const file of files) {
      const content = await fs.readFile(path.join(this.root, file));
      const source = content.toString();
      const packageName = this.getPackageDeclarationFromSource(source);
      const className = this.getClassNameFromSource(source);
      if (packageName && className) {
        results.push({ file, packageName, className });

        if (this.hasCustomConstructors(source, className)) {
          log.info(`Custom constructors found in ${className}.`);
          if (this.hasNoArgumentConstructor(source, className)) {
            log.warn(
              'It might be necessary to manually update the plugin config to make it a configurable plugin.',
            );
          } else {
            log.warn(
              'Manual updates are required in generated plugin for packages without a no-argument constructor.',
            );
          }
        }
      }
    }
    return results;
  }

  public getPackageDeclarationFromSource(source: string): string | null {
    const match = source.match(/package ([\w.]+);?/);
    return match ? match[1] : null;
  }

  public getClassNameFromSource(source: string): string | null {
    const match = source.match(
      /class\s+(\w+)\(?.*\)?\s*(implements|:)\s*ReactPackage/,
    );
    return match ? match[1] : null;
  }

  public hasNoArgumentConstructor(source: string, className: string): boolean {
    const re = new RegExp(
      `(public ${className}|constructor)\\((\\t*|\\s*)\\)`,
      'g',
    );
    return re.test(source);
  }

  public hasCustomConstructors(source: string, className: string): boolean {
    const re = new RegExp(
      `((public|class) ${className}|constructor)\\s*\\([^\\s).]+`,
      'g',
    );
    const match = source.match(re);
    return match !== null && match.length > 0;
  }

  get gradlePaths(): string[] {
    return this.files.filter((x) => x.endsWith('build.gradle'));
  }

  get androidManifestPaths(): string[] {
    return this.files.filter((x) => x.endsWith('AndroidManifest.xml'));
  }
}
