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

import _ from 'lodash';
import path from 'path';
import fs from 'fs-extra';
import readDir from 'fs-readdir-recursive';
import DecompressZip from 'decompress-zip';
import semver from 'semver';

const PATH_TO_TEMPLATES_DIR = path.join(__dirname, 'templates');
const PATH_TO_HULL_DIR = path.join(__dirname, 'hull');

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
      postBundle: this.postBundle.bind(this),
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
    const versions = android.resolveAndroidVersions(config.androidConfig);
    mustacheView = Object.assign(mustacheView, versions);

    const injectPluginsTaskMsg = 'Injecting Native Dependencies';
    const injectPluginsKaxTask = kax.task(injectPluginsTaskMsg);

    const replacements: Array<() => void> = [];
    const androidDependencies: AndroidDependencies = {
      annotationProcessor: [],
      files: [],
      raw: [],
      regular: [],
      transitive: [],
    };

    for (const plugin of config.plugins) {
      if (plugin.name === 'react-native') {
        continue;
      }

      let pluginConfig:
        | PluginConfig<'android'>
        | undefined = await manifest.getPluginConfig(plugin, 'android');
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
            } else if (/^[^:]+:[^:]+:[^:]+$/.test(dependency)) {
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

    // Dedupe repositories and permissions
    mustacheView.customRepos = _.uniq(mustacheView.customRepos);
    mustacheView.customPermissions = _.uniq(mustacheView.customPermissions);

    androidDependencies.regular.push(
      `com.walmartlabs.ern:react-native:${reactNativePlugin.version}`,
    );
    androidDependencies.regular.push(
      `com.android.support:appcompat-v7:${versions.supportLibraryVersion}`,
    );
    mustacheView.implementations = this.buildImplementationStatements(
      androidDependencies,
      versions,
    );

    log.debug(
      `Implementation statements to be injected: ${JSON.stringify(
        mustacheView.implementations,
      )}`,
    );

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
    const pathLibSrcMainJavaComWalmartlabsErnContainer = path.join(
      pathLibSrcMainJavaCom,
      'walmartlabs/ern/container',
    );
    for (const file of files) {
      if (
        (file.startsWith(pathLibSrcMainJavaCom) &&
          !file.startsWith(pathLibSrcMainJavaComWalmartlabsErnContainer)) ||
        file.startsWith(pathLibSrcMainAssets) ||
        file.startsWith(pathLibSrcMainJniLibs)
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

    if (semver.gte(reactNativePlugin.version, '0.60.0')) {
      this.getJavaScriptEngine(config) === JavaScriptEngine.JSC
        ? await kax
            .task('Injecting JavaScript engine [JavaScriptCore]')
            .run(
              this.injectJavaScriptCoreEngine(
                config,
                reactNativePlugin.version,
              ),
            )
        : await kax
            .task('Injecting JavaScript engine [Hermes]')
            .run(this.injectHermesEngine(config, reactNativePlugin.version));
    }
  }

  public async postBundle(
    config: ContainerGeneratorConfig,
    bundle: BundlingResult,
    reactNativeVersion: string,
  ) {
    if (this.getJavaScriptEngine(config) === JavaScriptEngine.HERMES) {
      const hermesVersion =
        config.androidConfig.hermesVersion ||
        android.getDefaultHermesVersion(reactNativeVersion);
      const hermesCli = await kax
        .task(`Installing hermes-engine@${hermesVersion}`)
        .run(HermesCli.fromVersion(hermesVersion));
      await kax.task('Compiling JS bundle to Hermes bytecode').run(
        hermesCli.compileReleaseBundle({
          bundleSourceMapPath: bundle.sourceMapPath,
          compositePath: config.composite.path,
          jsBundlePath: bundle.bundlePath,
        }),
      );
      bundle.isHermesBundle = true;
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

  /**
   * Starting with React Native 0.60.0, JavaScriptCore engine is distributed
   * separately from React Native and comes in two variants :
   * 'android-jsc' and 'android-jsc-intl'.
   *
   * More details@ https://github.com/react-native-community/jsc-android-buildscript
   *
   * Prior to React Native 0.60.0, the 'libjsc.so' native library files were
   * shipped inside React Native AAR itself. This is not the case anymore.
   * The 'libjsc.so' files are now distributed in the 'jsc-android' npm package,
   * inside an aar library.
   *
   * This function retrieve the 'jsc-android' package and unzip the AAR
   * matching the desired JSC variant ('android-jsc' or 'android-jsc-intl').
   * It then copy the 'libjsc.so' files to the 'jniLibs' directory of the
   * Container. This way, the JSC engine is shipped within the Container and
   * applications won't crash at runtime when trying to load this library.
   */
  public async injectJavaScriptCoreEngine(
    config: ContainerGeneratorConfig,
    reactNativeVersion: string,
  ) {
    let jscVersion =
      (config.androidConfig && config.androidConfig.jscVersion) ||
      android.getDefaultJSCVersion(reactNativeVersion);
    if (/^\d+$/.test(jscVersion)) {
      // For backward compatibility, to avoid breaking clients
      // that are already providing a version through config that
      // only specifies major excluding minor/patch
      jscVersion = `${jscVersion}.0.0`;
    }
    const jscVariant =
      (config.androidConfig && config.androidConfig.jscVariant) ||
      android.DEFAULT_JSC_VARIANT;
    const workingDir = createTmpDir();
    try {
      shell.pushd(workingDir);
      await yarn.init();
      await yarn.add(PackagePath.fromString(`jsc-android@${jscVersion}`));
      const versionMajor = semver.major(semver.coerce(jscVersion)!.version);
      const jscVersionPath = path.resolve(
        `./node_modules/jsc-android/dist/org/webkit/${jscVariant}/r${versionMajor}`,
      );
      const jscAARPath = path.join(
        jscVersionPath,
        `${jscVariant}-r${versionMajor}.aar`,
      );
      return new Promise((resolve, reject) => {
        const unzipper = new DecompressZip(jscAARPath);
        const unzipOutDir = createTmpDir();
        const containerJniLibsPath = path.join(
          config.outDir,
          'lib/src/main/jniLibs',
        );
        const unzippedJniPath = path.join(unzipOutDir, 'jni');
        unzipper.on('error', (err: any) => reject(err));
        unzipper.on('extract', () => {
          shell.cp('-Rf', unzippedJniPath, containerJniLibsPath);
          resolve();
        });
        unzipper.extract({ path: unzipOutDir });
      });
    } finally {
      shell.popd();
    }
  }

  /**
   * Inject hermes engine into the Container
   * Done in a similar way as injectJavaScriptCoreEngine method
   */
  public async injectHermesEngine(
    config: ContainerGeneratorConfig,
    reactNativeVersion: string,
  ) {
    const hermesVersion =
      (config.androidConfig && config.androidConfig.hermesVersion) ||
      android.getDefaultHermesVersion(reactNativeVersion);
    const workingDir = createTmpDir();
    try {
      shell.pushd(workingDir);
      await yarn.init();
      await yarn.add(PackagePath.fromString(`hermes-engine@${hermesVersion}`));
      const hermesAarPath = path.resolve(
        `./node_modules/hermes-engine/android/hermes-release.aar`,
      );
      return new Promise((resolve, reject) => {
        const unzipper = new DecompressZip(hermesAarPath);
        const unzipOutDir = createTmpDir();
        const containerJniLibsPath = path.join(
          config.outDir,
          'lib/src/main/jniLibs',
        );
        const unzippedJniPath = path.join(unzipOutDir, 'jni');
        unzipper.on('error', (err: any) => reject(err));
        unzipper.on('extract', () => {
          shell.cp('-Rf', unzippedJniPath, containerJniLibsPath);
          resolve();
        });
        unzipper.extract({ path: unzipOutDir });
      });
    } finally {
      shell.popd();
    }
  }

  public buildImplementationStatements(
    dependencies: AndroidDependencies,
    androidVersions: AndroidResolvedVersions,
  ) {
    const result: any[] = [];

    // Replace versions of support libraries with set version
    dependencies.regular = dependencies.regular.map((d) =>
      d.startsWith('com.android.support:')
        ? `${d.slice(0, d.lastIndexOf(':'))}:${
            androidVersions.supportLibraryVersion
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
      }
    }
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
