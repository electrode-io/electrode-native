import {
  android,
  AndroidResolvedVersions,
  BundlingResult,
  createTmpDir,
  gitApply,
  handleCopyDirective,
  HermesCli,
  injectReactNativeVersionKeysInObject,
  kax,
  log,
  manifest,
  mustacheUtils,
  NativePlatform,
  PackagePath,
  PluginConfig,
  readPackageJson,
  shell,
  utils as coreUtils,
  yarn,
} from 'ern-core';
import {
  ContainerGenerator,
  ContainerGeneratorConfig,
  ContainerGenResult,
  generateContainer,
  generatePluginsMustacheViews,
  populateApiImplMustacheView,
} from 'ern-container-gen';

import glob from 'glob';
import _ from 'lodash';
import path from 'path';
import fs from 'fs-extra';
import readDir from 'fs-readdir-recursive';
import semver from 'semver';

// tslint:disable-next-line:no-var-requires
const AdmZip = require('adm-zip');

const PATH_TO_TEMPLATES_DIR = path.join(__dirname, 'templates');
const PATH_TO_HULL_DIR = path.join(__dirname, 'hull');
const ERN_CUSTOM_REACT_NATIVE_AAR_PATCH_VERSION = 100;

export interface AndroidDependencies {
  files: string[];
  transitive: string[];
  raw: string[];
  regular: string[];
  annotationProcessor: string[];
}

export enum JavaScriptEngine {
  HERMES,
  JSC,
}

export default class AndroidGenerator implements ContainerGenerator {
  get name(): string {
    return 'AndroidGenerator';
  }

  get platform(): NativePlatform {
    return 'android';
  }

  public async generate(
    config: ContainerGeneratorConfig,
  ): Promise<ContainerGenResult> {
    return generateContainer(config, {
      fillContainerHull: this.fillContainerHull.bind(this),
    });
  }

  public async doesDirectoryContainsKotlinSourceFiles(
    dir: string,
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      glob(path.join(dir, '**/*.kt'), (err, files) => {
        if (err) {
          reject(err);
        } else {
          resolve(files?.length > 0);
        }
      });
    });
  }

  public async fillContainerHull(
    config: ContainerGeneratorConfig,
  ): Promise<void> {
    const copyFromPath = path.join(PATH_TO_HULL_DIR, '{.*,*}');

    shell.cp('-R', copyFromPath, config.outDir);

    // https://github.com/npm/npm/issues/1862 npm renames .gitignore to .npmignore causing the generated container to emit the .gitignore file. This solution below helps to bypass it.
    shell.mv(`${config.outDir}/gitignore`, `${config.outDir}/.gitignore`);

    const reactNativePlugin = _.find(
      config.plugins,
      (p) => p.name === 'react-native',
    );

    if (!reactNativePlugin) {
      throw new Error('react-native was not found in plugins list !');
    }
    if (!reactNativePlugin.version) {
      throw new Error('react-native plugin does not have a version !');
    }

    let mustacheView: any = {
      customFeatures: [],
      customPermissions: [],
      customRepos: [],
      permissions: [],
    };
    injectReactNativeVersionKeysInObject(
      mustacheView,
      reactNativePlugin.version,
    );

    const electrodeBridgePlugin = _.find(
      config.plugins,
      (p) => p.name === 'react-native-electrode-bridge',
    );

    if (electrodeBridgePlugin) {
      mustacheView.hasElectrodeBridgePlugin = true;
    }

    mustacheView.miniApps = await config.composite.getMiniApps();
    mustacheView.jsMainModuleName = config.jsMainModuleName || 'index';

    await kax
      .task('Preparing Native Dependencies Injection')
      .run(this.buildAndroidPluginsViews(config.plugins, mustacheView));

    await kax
      .task('Adding Native Dependencies Hooks')
      .run(this.addAndroidPluginHookClasses(config.plugins, config.outDir));

    kax.task('Setting Android tools and libraries versions').succeed();
    const versions = android.resolveAndroidVersions({
      reactNativeVersion: reactNativePlugin.version,
      ...config.androidConfig,
    });
    mustacheView = Object.assign(mustacheView, versions);

    const injectPluginsTaskMsg = 'Injecting Native Dependencies';
    const injectPluginsKaxTask = kax.task(injectPluginsTaskMsg);

    const replacements: (() => void)[] = [];
    const androidDependencies: AndroidDependencies = {
      annotationProcessor: [],
      files: [],
      raw: [],
      regular: [],
      transitive: [],
    };

    let isKotlinEnabled = false;

    for (const plugin of config.plugins) {
      if (plugin.name === 'react-native') {
        continue;
      }

      let pluginConfig: PluginConfig<'android'> | undefined =
        await manifest.getPluginConfig(plugin, 'android');
      if (!pluginConfig) {
        log.warn(
          `Skipping ${plugin.name} as it does not have an Android configuration`,
        );
        continue;
      }

      injectPluginsKaxTask.text = `${injectPluginsTaskMsg} [${plugin.name}]`;

      let pathToPluginProject;

      const pluginSourcePath = plugin.basePath;
      if (await coreUtils.isDependencyPathNativeApiImpl(pluginSourcePath)) {
        // For native api implementations, if a 'ern.pluginConfig' object
        // exists in its package.json, replace pluginConfig with this one.
        const pluginPackageJson = await readPackageJson(pluginSourcePath);
        if (pluginPackageJson.ern.pluginConfig) {
          pluginConfig = pluginPackageJson.ern.pluginConfig.android;
        }
        populateApiImplMustacheView(pluginSourcePath, mustacheView, true);
      }
      pathToPluginProject = path.join(pluginSourcePath, pluginConfig!.root);

      if (!isKotlinEnabled) {
        isKotlinEnabled = await this.doesDirectoryContainsKotlinSourceFiles(
          pathToPluginProject,
        );
      }

      shell.pushd(pathToPluginProject);
      try {
        if (await coreUtils.isDependencyPathNativeApiImpl(pluginSourcePath)) {
          // Special handling for native api implementation as we don't
          // want to copy the API and bridge code (part of native api implementations projects)
          const relPathToApiImplSource = path.normalize(
            'lib/src/main/java/com/ern',
          );
          const absPathToCopyPluginSourceTo = path.join(
            config.outDir,
            'lib/src/main/java/com',
          );
          shell.cp('-R', relPathToApiImplSource, absPathToCopyPluginSourceTo);
        } else {
          const relPathToPluginSource = pluginConfig!.moduleName
            ? path.join(pluginConfig!.moduleName, 'src/main/java')
            : path.join('src/main/java');
          const absPathToCopyPluginSourceTo = path.join(
            config.outDir,
            'lib/src/main',
          );

          if (semver.gte(reactNativePlugin.version, '0.60.0')) {
            const convertedFiles = this.convertToAndroidX(
              relPathToPluginSource,
            );
            if (convertedFiles > 0) {
              log.info(
                `${plugin.name} contains source files with references to the Android Support Library (android.support.*)`,
              );
              log.info(
                `${convertedFiles} files successfully converted to use AndroidX (androidx.*)`,
              );
            }
          }

          shell.cp('-R', relPathToPluginSource, absPathToCopyPluginSourceTo);
        }

        const {
          applyPatch,
          copy,
          dependencies,
          features,
          permissions,
          replaceInFile,
          repositories,
        } = pluginConfig!;

        if (copy) {
          handleCopyDirective(pluginSourcePath, config.outDir, copy);
        }

        if (replaceInFile && Array.isArray(replaceInFile)) {
          for (const r of replaceInFile) {
            replacements.push(() => {
              log.debug(`Performing string replacement on ${r.path}`);
              const pathToFile = path.join(config.outDir, r.path);
              const fileContent = fs.readFileSync(pathToFile, 'utf8');
              const patchedFileContent = fileContent.replace(
                RegExp(r.string, 'g'),
                r.replaceWith,
              );
              fs.writeFileSync(pathToFile, patchedFileContent, {
                encoding: 'utf8',
              });
            });
          }
        }

        if (applyPatch) {
          const { patch, root } = applyPatch;
          if (!patch) {
            throw new Error('Missing "patch" property in "applyPatch" object');
          }
          if (!root) {
            throw new Error('Missing "root" property in "applyPatch" object');
          }
          const [patchFile, rootDir] = [
            path.join(pluginConfig!.path!, patch),
            path.join(config.outDir, root),
          ];
          await gitApply({ patchFile, rootDir });
        }

        if (dependencies) {
          const transitivePrefix = 'transitive:';
          const filesPrefix = 'files';
          const annotationProcessorPrefix = 'annotationProcessor:';
          for (const dependency of dependencies) {
            if (dependency.startsWith(transitivePrefix)) {
              androidDependencies.transitive.push(
                dependency.replace(transitivePrefix, ''),
              );
              log.warn(
                `Deprecation warning for ${plugin.name} manifest configuration.
${transitivePrefix} dependency prefix has been deprecated and will be removed in a future release.
You should replace "${transitivePrefix}:${dependency}" with "implementation ('${dependency}') { transitive = true }"`,
              );
            } else if (dependency.startsWith(filesPrefix)) {
              androidDependencies.files.push(dependency);
              log.warn(
                `Deprecation warning for ${plugin.name} manifest configuration.
${filesPrefix} dependency prefix has been deprecated and will be removed in a future release.
You should replace "${dependency}" with "implementation ${dependency}"`,
              );
            } else if (dependency.startsWith(annotationProcessorPrefix)) {
              androidDependencies.annotationProcessor.push(
                dependency.replace(annotationProcessorPrefix, ''),
              );
              log.warn(
                `Deprecation warning for ${plugin.name} manifest configuration.
${annotationProcessorPrefix} dependency prefix has been deprecated and will be removed in a future release.
You should replace "${annotationProcessorPrefix}:${dependency}" with "annotationProcessor '${dependency}'"`,
              );
            } else if (/^[^:\s'(]+:[^:]+:[^:]+$/.test(dependency)) {
              androidDependencies.regular.push(dependency);
            } else {
              androidDependencies.raw.push(dependency);
            }
          }
        }

        if (repositories) {
          mustacheView.customRepos.push(...repositories);
        }

        if (permissions) {
          mustacheView.customPermissions.push(...permissions);
        }

        if (features) {
          mustacheView.customFeatures.push(...features);
        }
      } finally {
        shell.popd();
      }
    }

    const resPath = path.join(config.outDir, 'lib/src/main/res');
    const resSrcDirs = fs
      .readdirSync(resPath)
      .filter((f) => fs.statSync(path.join(resPath, f)).isDirectory())
      .map((d) => `'src/main/res/${d}'`)
      .join(',');
    mustacheView.resSrcDirs = resSrcDirs;

    mustacheView.isKotlinEnabled = isKotlinEnabled;

    // Dedupe repositories and permissions
    mustacheView.customRepos = _.uniq(mustacheView.customRepos);
    mustacheView.customPermissions = _.uniq(mustacheView.customPermissions);

    androidDependencies.raw.push(
      `api 'com.walmartlabs.ern:react-android:${versions.reactNativeAarVersion}'`,
    );

    if (isKotlinEnabled) {
      androidDependencies.regular.push(
        `org.jetbrains.kotlin:kotlin-stdlib:${versions.kotlinVersion}`,
      );
    }
    mustacheView.implementations = this.buildImplementationStatements(
      androidDependencies,
      versions,
    );

    log.debug(
      `Implementation statements to be injected: ${JSON.stringify(
        mustacheView.implementations,
      )}`,
    );

    if (
      semver.patch(versions.reactNativeAarVersion) >=
      ERN_CUSTOM_REACT_NATIVE_AAR_PATCH_VERSION
    ) {
      mustacheView.isCustomReactNativeAar = true;
    }

    injectPluginsKaxTask.succeed(injectPluginsTaskMsg);

    const partialProxy = (name: string) => {
      return fs.readFileSync(
        path.join(PATH_TO_TEMPLATES_DIR, `${name}.mustache`),
        'utf8',
      );
    };

    log.debug('Patching hull');
    const files = readDir(
      config.outDir,
      (f) => !f.endsWith('.jar') && !f.endsWith('.aar') && !f.endsWith('.git'),
    );
    const pathLibSrcMain = path.normalize('lib/src/main');
    const pathLibSrcMainJniLibs = path.normalize('lib/src/main/jniLibs');
    const pathLibSrcMainAssets = path.normalize('lib/src/main/assets');
    const pathLibSrcMainJavaCom = path.join(pathLibSrcMain, 'java/com');
    const pathLibSrcMainRes = path.join(pathLibSrcMain, 'res');
    const pathLibSrcMainJavaComWalmartlabsErnContainer = path.join(
      pathLibSrcMainJavaCom,
      'walmartlabs/ern/container',
    );
    for (const file of files) {
      if (
        (file.startsWith(pathLibSrcMainJavaCom) &&
          !file.startsWith(pathLibSrcMainJavaComWalmartlabsErnContainer)) ||
        file.startsWith(pathLibSrcMainAssets) ||
        file.startsWith(pathLibSrcMainJniLibs) ||
        file.startsWith(pathLibSrcMainRes)
      ) {
        // We don't want to Mustache process library files. It can lead to bad things
        // We also don't want to process assets files ...
        // We just want to process container specific code (which contains mustache templates)
        continue;
      }
      log.debug(`Mustaching ${file}`);
      const pathToFile = path.join(config.outDir, file);
      await mustacheUtils.mustacheRenderToOutputFileUsingTemplateFile(
        pathToFile,
        mustacheView,
        pathToFile,
        partialProxy,
      );
    }

    log.debug('Creating miniapp activities');
    const compositeMiniApps = await config.composite.getMiniApps();
    for (const miniApp of compositeMiniApps) {
      const activityFileName = `${miniApp.pascalCaseName}Activity.java`;

      log.debug(`Creating ${activityFileName}`);
      const pathToMiniAppActivityMustacheTemplate = path.join(
        PATH_TO_TEMPLATES_DIR,
        'MiniAppActivity.mustache',
      );
      const pathToOutputActivityFile = path.join(
        config.outDir,
        pathLibSrcMainJavaComWalmartlabsErnContainer,
        'miniapps',
        activityFileName,
      );
      await mustacheUtils.mustacheRenderToOutputFileUsingTemplateFile(
        pathToMiniAppActivityMustacheTemplate,
        miniApp,
        pathToOutputActivityFile,
        partialProxy,
      );
    }

    for (const perform of replacements) {
      perform();
    }
  }

  public getJavaScriptEngine(
    config: ContainerGeneratorConfig,
  ): JavaScriptEngine {
    return config.androidConfig
      ? config.androidConfig.jsEngine === 'jsc'
        ? JavaScriptEngine.JSC
        : config.androidConfig.jsEngine === 'hermes'
        ? JavaScriptEngine.HERMES
        : JavaScriptEngine.JSC
      : JavaScriptEngine.JSC;
  }

  public buildImplementationStatements(
    dependencies: AndroidDependencies,
    androidVersions: AndroidResolvedVersions,
  ) {
    const result: any[] = [];

    // Replace versions of support libraries with set version
    dependencies.regular = dependencies.regular.map((d) =>
      d.startsWith('androidx.appcompat:')
        ? `${d.slice(0, d.lastIndexOf(':'))}:${
            androidVersions.androidxAppcompactVersion
          }`
        : d,
    );

    // Dedupe dependencies with same version
    dependencies.regular = _.uniq(dependencies.regular);
    dependencies.files = _.uniq(dependencies.files);
    dependencies.raw = _.uniq(dependencies.raw);
    dependencies.transitive = _.uniq(dependencies.transitive);
    dependencies.annotationProcessor = _.uniq(dependencies.annotationProcessor);

    // Use highest versions for regular and transitive
    // dependencies with multiple versions
    const g = _.groupBy(
      dependencies.regular,
      (x) => x.match(/^[^:]+:[^:]+/)![0],
    );
    dependencies.regular = Object.keys(g).map((x) => this.highestVersion(g[x]));
    const h = _.groupBy(
      dependencies.transitive,
      (x) => x.match(/^[^:]+:[^:]+/)![0],
    );
    dependencies.transitive = Object.keys(h).map((x) =>
      this.highestVersion(h[x]),
    );

    // Add dependencies to result
    dependencies.regular.forEach((d) => result.push(`implementation '${d}'`));
    dependencies.files.forEach((d) => result.push(`implementation ${d}`));
    dependencies.raw.forEach((d) => {
      result.push(d);
    });
    dependencies.transitive.forEach((d) =>
      result.push(`implementation ('${d}') { transitive = true }`),
    );
    dependencies.annotationProcessor.forEach((d) =>
      result.push(`annotationProcessor '${d}'`),
    );
    return result;
  }

  public highestVersion(d: string[]): string {
    if (d.length === 1) {
      return d[0];
    }
    const name = d[0].match(/^[^:]+:[^:]+/)![0];
    const version = d
      .map((x) => x.match(/^[^:]+:[^:]+:(.+)/)![1])
      // Trick to make highest version lookup as easy
      // as peforming a lexical sort
      .map((x) => x.replace('+', '999999'))
      .sort()
      .map((x) => x.replace('999999', '+'))
      .pop();
    return `${name}:${version}`;
  }

  public async addAndroidPluginHookClasses(
    plugins: PackagePath[],
    outDir: string,
  ): Promise<any> {
    const rnVersion = plugins.find((p) => p.name === 'react-native')?.version!;
    for (const plugin of plugins) {
      if (plugin.name === 'react-native') {
        continue;
      }
      const pluginConfig = await manifest.getPluginConfig(plugin, 'android');
      if (!pluginConfig) {
        log.warn(
          `Skipping ${plugin.name} as it does not have an Android configuration`,
        );
        continue;
      }
      const androidPluginHook = pluginConfig.pluginHook;
      if (androidPluginHook) {
        log.debug(`Adding ${androidPluginHook.name}.java`);
        if (!pluginConfig.path) {
          throw new Error('No plugin config path was set. Cannot proceed.');
        }
        const pathToPluginConfigHook = path.join(
          pluginConfig.path,
          `${androidPluginHook.name}.java`,
        );
        const pathToCopyPluginConfigHookTo = path.join(
          outDir,
          'lib/src/main/java/com/walmartlabs/ern/container/plugins',
        );
        shell.cp(pathToPluginConfigHook, pathToCopyPluginConfigHookTo);

        if (semver.gte(rnVersion, '0.60.0')) {
          const filesConverted = this.convertToAndroidX(
            pathToCopyPluginConfigHookTo,
          );
          if (filesConverted > 0) {
            log.info(
              `${plugin.name} contains source files with references to the Android Support Library (android.support.*)`,
            );
            log.info(
              `${filesConverted} files successfully converted to use AndroidX (androidx.*)`,
            );
          }
        }
      }
    }
  }

  /**
   * Convert files in a directory from support library to AndroidX
   * eg: import android.support.annotation.NonNull => import androidx.annotation.NonNull
   */
  public convertToAndroidX(dir: string): number {
    const filesWithSupportLib: string[] = [];
    shell.pushd(dir);
    shell
      .ls('-R', '.')
      .filter((file) => file.match(/\.(java|kt)$/))
      .forEach((file) => {
        if (shell.grep('android.support', file).trim().length !== 0) {
          filesWithSupportLib.push(file);
        }
      });

    filesWithSupportLib.forEach((file) => {
      shell.sed('-i', 'android.support', 'androidx', file);
    });

    shell.popd();

    return filesWithSupportLib.length;
  }

  public async buildAndroidPluginsViews(
    plugins: PackagePath[],
    mustacheView: any,
  ): Promise<any> {
    mustacheView.plugins = await generatePluginsMustacheViews(
      plugins,
      'android',
    );
    const reactNativeCodePushPlugin = _.find(
      plugins,
      (p) => p.name === 'react-native-code-push',
    );
    if (reactNativeCodePushPlugin) {
      mustacheView.isCodePushPluginIncluded = true;
    }
  }
}
