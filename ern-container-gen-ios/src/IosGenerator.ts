import {
  childProcess,
  createTmpDir,
  injectReactNativeVersionKeysInObject,
  iosUtil,
  kax,
  log,
  manifest,
  mustacheUtils,
  NativePlatform,
  PackagePath,
  PluginConfig,
  readPackageJson,
  shell,
  utils,
  writePackageJson,
  yarn,
  config as ernConfig,
} from 'ern-core';
import {
  ContainerGenerator,
  ContainerGeneratorConfig,
  ContainerGenResult,
  generateContainer,
  generatePluginsMustacheViews,
  populateApiImplMustacheView,
} from 'ern-container-gen';

import fs from 'fs-extra';
import path from 'path';
import xcode from 'xcode-ern';
import _ from 'lodash';
import readDir from 'fs-readdir-recursive';
import { Composite } from 'ern-composite-gen';
import semver from 'semver';

const ROOT_DIR = process.cwd();
const PATH_TO_TEMPLATES_DIR = path.join(__dirname, 'templates');
const PATH_TO_HULL_DIR = path.join(__dirname, 'hull');

export default class IosGenerator implements ContainerGenerator {
  get name(): string {
    return 'IosGenerator';
  }

  get platform(): NativePlatform {
    return 'ios';
  }

  public async generate(
    config: ContainerGeneratorConfig,
  ): Promise<ContainerGenResult> {
    return generateContainer(config, {
      fillContainerHull: this.fillContainerHull.bind(this),
      postCopyRnpmAssets: this.addResources.bind(this),
    });
  }

  public async addResources(config: ContainerGeneratorConfig) {
    const containerProjectPath = path.join(
      config.outDir,
      'ElectrodeContainer.xcodeproj',
      'project.pbxproj',
    );
    const containerIosProject = await this.getIosContainerProject(
      containerProjectPath,
    );

    const containerResourcesPath = path.join(
      config.outDir,
      'ElectrodeContainer',
      'Resources',
    );
    // Get all resources files from the 'Resources' directory
    // Some processing is done here to properly handle `.xcassets`
    // files which are directories containing assets.
    // But we don't want to add independent files from this directory
    // to the pbxproj, but only the top level `.xcassets` directory.
    //
    // For example, an  `xcassets` directory might look like this
    //
    // Media.xcassets
    // ├── Contents.json
    // ├── Face-ID.imageset
    // │   ├── Contents.json
    // │   └── faceid.pdf
    // ├── IconUser.imageset
    // │   ├── Contents.json
    // │   └── IconUser.pdf
    //
    // Which will result in recursive readir call returning the
    // following paths
    //
    // Media.xcassets/Contents.json
    // Media.xcassets/Face-ID.imageset/Contents.json
    // Media.xcassets/Face-ID.imageset/faceid.pdf
    // ...
    //
    // Each of these individual files would then wrongly be
    // added to the pbxproj as resources.
    // However we just want top level directory Media.xcassets
    // to be added to the pbxproj, thus the special processing.
    const resourceFiles = _.uniq(
      readDir(containerResourcesPath).map((f) =>
        f.replace(/(\.xcassets)(\/.+)$/, '$1'),
      ),
    );
    resourceFiles.forEach((resourceFile) => {
      containerIosProject.addResourceFile(
        path.join('Resources', resourceFile),
        null,
        containerIosProject.findPBXGroupKey({ name: 'Resources' }),
      );
    });

    fs.writeFileSync(containerProjectPath, containerIosProject.writeSync());
  }

  public async fillContainerHull(
    config: ContainerGeneratorConfig,
  ): Promise<void> {
    if (process.platform !== 'darwin' && !config?.iosConfig?.skipInstall) {
      throw new Error(
        `Full iOS Container generation with pod installation is only supported on macOS.
You can set 'iosConfig.skipInstall' in container generator config to skip the installation step.
Or set --skipInstall if using the create-container command.`,
      );
    }

    if (config?.iosConfig?.skipInstall) {
      log.info(
        `skipInstall option is set. 'yarn install' and 'pod install' won't be run after container generation.
Make sure to run these commands before building the container.`,
      );
    }

    const pathSpec = {
      outputDir: config.outDir,
      projectHullDir: path.join(PATH_TO_HULL_DIR, '{.*,*}'),
      rootDir: ROOT_DIR,
    };

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

    const mustacheView: any = {};
    mustacheView.jsMainModuleName = config.jsMainModuleName || 'index';
    mustacheView.iosDeploymentTarget =
      config.iosConfig?.deploymentTarget ??
      iosUtil.getDefaultIosDeploymentTarget(reactNativePlugin.version);

    injectReactNativeVersionKeysInObject(
      mustacheView,
      reactNativePlugin.version,
    );

    const projectSpec = {
      deploymentTarget: mustacheView.iosDeploymentTarget,
      projectName: 'ElectrodeContainer',
    };

    await kax
      .task('Preparing Native Dependencies Injection')
      .run(this.buildiOSPluginsViews(config.plugins, mustacheView));

    await kax
      .task('Preparing API Implementations Injection')
      .run(
        this.buildApiImplPluginViews(
          config.plugins,
          config.composite,
          mustacheView,
          projectSpec,
        ),
      );

    if (semver.gte(reactNativePlugin.version!, '0.61.0')) {
      shell.pushd(config.outDir);
      try {
        await yarn.init();

        // Add @react-native-community/cli-platform-ios because
        // it contains the scripts needed for native modules pods linking
        // look in composite to match proper version
        const compositeNodeModulesPath = path.join(
          config.composite.path,
          'node_modules',
        );
        const cliPlatformIosPkg = '@react-native-community/cli-platform-ios';
        const cliPlatformIosPkgVersion = (
          await readPackageJson(
            path.join(compositeNodeModulesPath, cliPlatformIosPkg),
          )
        ).version;

        await yarn.add(
          PackagePath.fromString(
            `${cliPlatformIosPkg}@${cliPlatformIosPkgVersion}`,
          ),
        );

        await yarn.add(
          PackagePath.fromString(`react-native@${reactNativePlugin.version}`),
        );

        //
        // Add all native dependencies to package.json dependencies so that
        // !use_native_modules can detect them to add their pod to the Podfile
        const dependencies = await config.composite.getNativeDependencies({});
        const resDependencies = [
          ...dependencies.thirdPartyInManifest,
          ...dependencies.thirdPartyNotInManifest,
        ];

        const addDependencies: any = {};
        resDependencies.forEach((p) => {
          addDependencies[p.name!] = p.version;
        });

        //
        // Create package.json in container directory root
        // so that native modules pods can be resolved
        // by use_native_modules! RN ruby script
        const pjsonObj = {
          dependencies: addDependencies,
          name: 'container',
          private: true,
        };
        await writePackageJson(config.outDir, pjsonObj);

        //
        // Copy all native dependencies from composite node_modules
        // to container node_modules so that pods can be found local
        // to the container directory
        // [only for full iOS container generation]
        if (!config?.iosConfig?.skipInstall) {
          const containerNodeModulesPath = path.join(
            config.outDir,
            'node_modules',
          );
          shell.mkdir('-p', containerNodeModulesPath);
          resDependencies.forEach((p) => {
            const depPath = p.basePath!.match(/node_modules\/(.+)/)![1];
            const targetPath = path.join(containerNodeModulesPath, depPath);
            shell.mkdir('-p', targetPath);
            shell.cp('-rf', path.join(p.basePath!, '{.*,*}'), targetPath);
          });
        } else {
          shell.rm('-rf', 'node_modules');
        }
      } finally {
        shell.popd();
      }
    }

    const { iosProject, projectPath } = await iosUtil.fillProjectHull(
      pathSpec,
      projectSpec,
      config.plugins,
      mustacheView,
      config.composite,
      config.iosConfig,
    );

    await kax
      .task('Adding MiniAppNavigationController Classes')
      .run(this.addMiniAppNavigationControllerClasses(config, iosProject));

    await kax
      .task('Adding Native Dependencies Hooks')
      .run(
        this.addiOSPluginHookClasses(iosProject, config.plugins, config.outDir),
      );

    fs.writeFileSync(projectPath, iosProject.writeSync());

    if (semver.gte(reactNativePlugin.version!, '0.61.0')) {
      // For full iOS container generation, run 'pod install'
      // and also add all essential node_modules (needed for the build)
      // to the container
      if (!config?.iosConfig?.skipInstall) {
        const podVersionArg = ernConfig.get('podVersion')
          ? `_${ernConfig.get('podVersion')}_`
          : '';

        const podRepoUpdateArg = config?.iosConfig?.podRepoUpdate
          ? '--repo-update'
          : '';

        const podCmdArgs = [
          podVersionArg,
          'install',
          podRepoUpdateArg,
          '--verbose',
        ].filter((x: string) => x !== '');

        shell.pushd(config.outDir);

        try {
          await kax
            .task(`Running pod ${podCmdArgs.join(' ')}`)
            .run(childProcess.spawnp('pod', podCmdArgs));
        } finally {
          shell.popd();
        }

        //
        // Clean node_modules by only keeping the directories that are
        // needed for proper container build.
        shell.pushd(config.outDir);
        try {
          //
          // Look in the Pods pbxproj for any references to some files
          // kepts in some node_module subdirectory (basically react-native
          // as well as all native modules)
          const f = fs.readFileSync('Pods/Pods.xcodeproj/project.pbxproj', {
            encoding: 'utf8',
          });

          //
          // Build an array of these directories
          const re = RegExp('"?../node_modules/([^"]+)"?;', 'g');
          const matches = [];
          let match = re.exec(f);
          while (match !== null) {
            matches.push(match[1]);
            match = re.exec(f);
          }
          const res = matches
            .map((r) => r.split('/'))
            .filter((x) => x[0] !== 'react-native')
            .map((x) => x.join('/'))
            .concat('react-native');

          //
          // Copy all retained directories from 'node_modules'
          // to a new directory 'node_modules_light'
          const nodeModulesLightDir = 'node_modules_light';
          const nodeModulesDir = 'node_modules';
          shell.mkdir('-p', nodeModulesLightDir);
          for (const b of res) {
            shell.mkdir('-p', path.join(nodeModulesLightDir, b));
            shell.cp(
              '-Rf',
              path.join(nodeModulesDir, b, '{.*,*}'),
              path.join(nodeModulesLightDir, b),
            );
          }
          //
          // Replace the huge 'node_modules' directory with the skimmed one
          shell.rm('-rf', nodeModulesDir);
          shell.mv(nodeModulesLightDir, nodeModulesDir);
          //
          // Finally get rid of all android directories to further reduce
          // overall 'node_modules' directory size, as they are not needed
          // for iOS container builds.
          shell.rm('-rf', path.join(nodeModulesDir, '**/android'));

          const codegenVersion = iosUtil.getReactNativeCodegenVersion(
            reactNativePlugin.version,
          );
          if (codegenVersion) {
            // Starting with React Native 0.64.0, code generation for Turbo Modules
            // is performed using react-native-codegen package.
            // The package entry point is invoked during Xcode build of FBReactNativeSpec
            // iOS project (run as a build phase script).
            // It therefore needs to be present in the node modules of the Container.
            //
            // TODO : Dig deeper to figure out if we could instead call this script during
            // container generation and get rid of the the build script phase after doing
            // that, so that we don't clutter node_modules of the container pushed to git
            // and that Node does not have to be a requirement to build containers.
            await this.addReactNativeCodegen(config.outDir, codegenVersion);
          }
        } finally {
          shell.popd();
        }
      }
    }
  }

  public async addReactNativeCodegen(targetDir: string, version: string) {
    log.debug('Adding @react-native/codegen package');
    const tmpDir = createTmpDir();
    shell.pushd(tmpDir);
    try {
      await yarn.init();
      await yarn.add(
        PackagePath.fromString(`@react-native/codegen@${version}`),
      );
      // mkdirp and invariant are also needed
      await yarn.add(PackagePath.fromString('mkdirp'));
      await yarn.add(PackagePath.fromString('invariant'));

      // yargs is needed since this package is missing from generate-specs-cli script. - https://github.com/facebook/react-native/issues/36315
      // Resolved from RN 0.72.0-rc.0 to prevent script failures - https://github.com/facebook/react-native/commit/5093e557efac35632d99cd2094527f9e01cbc519
      await yarn.add(PackagePath.fromString('yargs'));

      shell.rm('-rf', [
        'package.json',
        'yarn.lock',
        'node_modules/.yarn-integrity',
      ]);
      shell.cp('-Rf', path.join(tmpDir, 'node_modules'), targetDir);
    } finally {
      shell.popd();
    }
  }

  // Code to keep backward compatibility
  public switchToOldDirectoryStructure(
    pluginSourcePath: string,
    tail: string,
  ): boolean {
    // This is to check if the api referenced during container generation is created using the old or new directory structure to help keep the backward compatibility.
    const pathToSwaggersAPIs = path.join(
      'IOS',
      'IOS',
      'Classes',
      'SwaggersAPIs',
    );
    if (
      path.dirname(tail) === 'IOS' &&
      fs.pathExistsSync(
        path.join(pluginSourcePath, path.dirname(pathToSwaggersAPIs)),
      )
    ) {
      return true;
    }
    return false;
  }

  public async buildiOSPluginsViews(
    plugins: PackagePath[],
    mustacheView: any,
  ): Promise<any> {
    mustacheView.plugins = await generatePluginsMustacheViews(plugins, 'ios');
  }

  public async addiOSPluginHookClasses(
    containerIosProject: any,
    plugins: PackagePath[],
    outDir: string,
  ): Promise<any> {
    for (const plugin of plugins) {
      if (plugin.name === 'react-native') {
        continue;
      }
      const pluginConfig: PluginConfig<'ios'> | undefined =
        await manifest.getPluginConfig(plugin, 'ios');
      if (!pluginConfig) {
        log.warn(
          `${plugin.name} does not have any injection configuration for ios platform`,
        );
        continue;
      }

      const { pluginHook } = pluginConfig!;

      if (pluginHook?.name) {
        if (!pluginConfig.path) {
          throw new Error('No plugin config path was set. Cannot proceed.');
        }

        const pluginConfigPath = pluginConfig.path;
        const pathToCopyPluginHooksTo = path.join(outDir, 'ElectrodeContainer');

        log.debug(`Adding ${pluginHook.name}.h`);
        const pathToPluginHookHeader = path.join(
          pluginConfigPath,
          `${pluginHook.name}.h`,
        );
        shell.cp(pathToPluginHookHeader, pathToCopyPluginHooksTo);
        containerIosProject.addHeaderFile(
          `${pluginHook.name}.h`,
          { public: true },
          containerIosProject.findPBXGroupKey({ name: 'ElectrodeContainer' }),
        );

        log.debug(`Adding ${pluginHook.name}.m`);
        const pathToPluginHookSource = path.join(
          pluginConfigPath,
          `${pluginHook.name}.m`,
        );
        shell.cp(pathToPluginHookSource, pathToCopyPluginHooksTo);
        containerIosProject.addSourceFile(
          `${pluginHook.name}.m`,
          null,
          containerIosProject.findPBXGroupKey({ name: 'ElectrodeContainer' }),
        );
      }
    }
  }

  public async getIosContainerProject(
    containerProjectPath: string,
  ): Promise<any> {
    const containerProject = xcode.project(containerProjectPath);
    return new Promise((resolve, reject) => {
      containerProject.parse((err: any) => {
        if (err) {
          reject(err);
        }
        resolve(containerProject);
      });
    });
  }

  public async buildApiImplPluginViews(
    plugins: PackagePath[],
    composite: Composite,
    mustacheView: any,
    projectSpec: any,
  ) {
    for (const plugin of plugins) {
      const pluginConfig = await manifest.getPluginConfig(
        plugin,
        'ios',
        projectSpec.projectName,
      );
      if (!pluginConfig) {
        continue;
      }

      if (await utils.isDependencyPathNativeApiImpl(plugin.basePath)) {
        populateApiImplMustacheView(plugin.basePath, mustacheView, true);
      }
    }

    if (mustacheView.apiImplementations) {
      mustacheView.hasApiImpl = true;
      for (const api of mustacheView.apiImplementations) {
        if (api.hasConfig) {
          mustacheView.hasAtleastOneApiImplConfig = true;
          break;
        }
      }
    }
  }

  public async addMiniAppNavigationControllerClasses(
    config: ContainerGeneratorConfig,
    containerIosProject: any,
  ) {
    const partialProxy = (name: string) => {
      return fs.readFileSync(
        path.join(PATH_TO_TEMPLATES_DIR, `${name}.mustache`),
        'utf8',
      );
    };

    log.debug('Creating miniapps config');
    const configFileName = `MiniAppsConfig.swift`;
    const pathToMiniAppsConfigMustacheTemplate = path.join(
      PATH_TO_TEMPLATES_DIR,
      'MiniAppsConfig.mustache',
    );
    const pathToOutputConfigFile = path.join(
      config.outDir,
      'ElectrodeContainer',
      'MiniAppNavigationControllers',
      configFileName,
    );
    const mustacheView: any = {};
    mustacheView.miniApps = await config.composite.getMiniApps();
    await mustacheUtils.mustacheRenderToOutputFileUsingTemplateFile(
      pathToMiniAppsConfigMustacheTemplate,
      mustacheView,
      pathToOutputConfigFile,
      partialProxy,
    );
    const relativePathToConfigFile = path.join(
      'MiniAppNavigationControllers',
      configFileName,
    );
    containerIosProject.addFile(
      relativePathToConfigFile,
      containerIosProject.findPBXGroupKey({
        name: 'MiniAppNavigationControllers',
      }),
    );
    containerIosProject.addSourceFile(
      relativePathToConfigFile,
      null,
      containerIosProject.findPBXGroupKey({
        name: 'MiniAppNavigationControllers',
      }),
    );

    log.debug('Creating miniapp nav controllers');
    const compositeMiniApps = await config.composite.getMiniApps();
    for (const miniApp of compositeMiniApps) {
      const navControllerFileName = `${miniApp.pascalCaseName}NavigationController.swift`;

      log.debug(`Creating ${navControllerFileName}`);
      const pathToMiniAppNavControllerMustacheTemplate = path.join(
        PATH_TO_TEMPLATES_DIR,
        'MiniAppNavigationController.mustache',
      );
      const pathToOutputNavControllerFile = path.join(
        config.outDir,
        'ElectrodeContainer',
        'MiniAppNavigationControllers',
        navControllerFileName,
      );
      await mustacheUtils.mustacheRenderToOutputFileUsingTemplateFile(
        pathToMiniAppNavControllerMustacheTemplate,
        miniApp,
        pathToOutputNavControllerFile,
        partialProxy,
      );
      const relativePathToNavControllerFile = path.join(
        'MiniAppNavigationControllers',
        navControllerFileName,
      );
      containerIosProject.addFile(
        relativePathToNavControllerFile,
        containerIosProject.findPBXGroupKey({
          name: 'MiniAppNavigationControllers',
        }),
      );
      containerIosProject.addSourceFile(
        relativePathToNavControllerFile,
        null,
        containerIosProject.findPBXGroupKey({
          name: 'MiniAppNavigationControllers',
        }),
      );
    }
  }
}
