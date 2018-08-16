import {
  manifest,
  handleCopyDirective,
  utils as coreUtils,
  mustacheUtils,
  PackagePath,
  shell,
  BundlingResult,
  log,
  NativePlatform,
  kax,
} from 'ern-core'
import {
  ContainerGenerator,
  ContainerGeneratorConfig,
  ContainerGenResult,
  addElectrodeNativeMetadataFile,
  bundleMiniApps,
  copyRnpmAssets,
  generatePluginsMustacheViews,
  injectReactNativeVersionKeysInObject,
  populateApiImplMustacheView,
  prepareDirectories,
  sortDependenciesByName,
} from 'ern-container-gen'

import _ from 'lodash'
import path from 'path'
import readDir from 'fs-readdir-recursive'

const PATH_TO_TEMPLATES_DIR = path.join(__dirname, 'templates')
const PATH_TO_HULL_DIR = path.join(__dirname, 'hull')

export default class AndroidGenerator implements ContainerGenerator {
  get name(): string {
    return 'AndroidGenerator'
  }

  get platform(): NativePlatform {
    return 'android'
  }

  public async generate(
    config: ContainerGeneratorConfig
  ): Promise<ContainerGenResult> {
    prepareDirectories(config)
    config.plugins = sortDependenciesByName(config.plugins)

    shell.pushd(config.outDir)

    try {
      await this.fillContainerHull(config)

      const jsApiImplDependencies = await coreUtils.extractJsApiImplementations(
        config.plugins
      )

      const bundlingResult: BundlingResult = await kax
        .task('Bundling MiniApps')
        .run(
          bundleMiniApps(
            config.miniApps,
            config.compositeMiniAppDir,
            config.outDir,
            'android',
            { pathToYarnLock: config.pathToYarnLock },
            jsApiImplDependencies
          )
        )

      if (!config.ignoreRnpmAssets) {
        await kax
          .task('Coying rnpm assets -if any-')
          .run(
            copyRnpmAssets(
              config.miniApps,
              config.compositeMiniAppDir,
              config.outDir,
              'android'
            )
          )
      }

      await kax
        .task('Adding Electrode Native Metadata File')
        .run(addElectrodeNativeMetadataFile(config))

      return {
        bundlingResult,
      }
    } finally {
      shell.popd()
    }
  }

  public async fillContainerHull(
    config: ContainerGeneratorConfig
  ): Promise<void> {
    const copyFromPath = path.join(PATH_TO_HULL_DIR, '{.*,*}')

    shell.cp('-R', copyFromPath, config.outDir)

    // https://github.com/npm/npm/issues/1862 : Npm renames .gitigonre to .npmignore causing the generated contaier to emit the .gitnore file. This solution below helps to bypass it.
    shell.mv(`${config.outDir}/gitignore`, `${config.outDir}/.gitignore`)

    const reactNativePlugin = _.find(
      config.plugins,
      p => p.basePath === 'react-native'
    )
    if (!reactNativePlugin) {
      throw new Error('react-native was not found in plugins list !')
    }
    if (!reactNativePlugin.version) {
      throw new Error('react-native plugin does not have a version !')
    }

    const mustacheView: any = {}
    injectReactNativeVersionKeysInObject(
      mustacheView,
      reactNativePlugin.version
    )
    mustacheView.miniApps = config.miniApps

    await kax
      .task('Preparing Native Dependencies Injection')
      .run(this.buildAndroidPluginsViews(config.plugins, mustacheView))

    await kax
      .task('Adding Native Dependencies Hooks')
      .run(this.addAndroidPluginHookClasses(config.plugins, config.outDir))

    const injectPluginsTaskMsg = 'Injecting Native Dependencies'
    const injectPluginsKaxTask = kax.task(injectPluginsTaskMsg)
    for (const plugin of config.plugins) {
      if (await coreUtils.isDependencyJsApiImpl(plugin.basePath)) {
        log.debug('JS api implementation identified, skipping fill hull.')
        continue
      }

      const pluginConfig = await manifest.getPluginConfig(plugin)
      let pluginSourcePath
      if (plugin.basePath === 'react-native') {
        continue
      }

      if (!pluginConfig.android) {
        log.warn(
          `Skipping ${
            plugin.basePath
          } as it does not have an Android configuration`
        )
        continue
      }

      injectPluginsKaxTask.text = `${injectPluginsTaskMsg} [${plugin.basePath}]`

      shell.pushd(config.pluginsDownloadDir)

      let pathToPluginProject
      try {
        pluginSourcePath = await coreUtils.downloadPluginSource(
          pluginConfig.origin
        )
        if (!pluginSourcePath) {
          throw new Error(`Was not able to download ${plugin.basePath}`)
        }

        if (await coreUtils.isDependencyNativeApiImpl(plugin.basePath)) {
          populateApiImplMustacheView(pluginSourcePath, mustacheView, true)
        }

        pathToPluginProject = path.join(
          pluginSourcePath,
          pluginConfig.android.root
        )
      } finally {
        shell.popd()
      }

      shell.pushd(pathToPluginProject)
      try {
        const relPathToPluginSource = pluginConfig.android.moduleName
          ? path.join(pluginConfig.android.moduleName, 'src', 'main', 'java')
          : path.join('src', 'main', 'java')
        const absPathToCopyPluginSourceTo = path.join(
          config.outDir,
          'lib',
          'src',
          'main'
        )
        shell.cp('-R', relPathToPluginSource, absPathToCopyPluginSourceTo)

        if (pluginConfig.android) {
          if (pluginConfig.android.copy) {
            handleCopyDirective(
              pluginSourcePath,
              config.outDir,
              pluginConfig.android.copy
            )
          }

          if (pluginConfig.android.dependencies) {
            for (const dependency of pluginConfig.android.dependencies) {
              log.debug(`Adding compile '${dependency}'`)
              mustacheView.pluginCompile.push({
                compileStatement: `compile '${dependency}'`,
              })
            }
          }
        }
      } finally {
        shell.popd()
      }
    }
    injectPluginsKaxTask.succeed(injectPluginsTaskMsg)

    log.debug('Patching hull')
    const files = readDir(
      config.outDir,
      f => !f.endsWith('.jar') && !f.endsWith('.aar') && !f.endsWith('.git')
    )
    const pathLibSrcMain = path.join('lib', 'src', 'main')
    const pathLibSrcMainAssets = path.join('lib', 'src', 'main', 'assets')
    const pathLibSrcMainJavaCom = path.join(pathLibSrcMain, 'java', 'com')
    const pathLibSrcMainJavaComWalmartlabsErnContainer = path.join(
      pathLibSrcMainJavaCom,
      'walmartlabs',
      'ern',
      'container'
    )
    for (const file of files) {
      if (
        (file.startsWith(pathLibSrcMainJavaCom) &&
          !file.startsWith(pathLibSrcMainJavaComWalmartlabsErnContainer)) ||
        file.startsWith(pathLibSrcMainAssets)
      ) {
        // We don't want to Mustache process library files. It can lead to bad things
        // We also don't want to process assets files ...
        // We just want to process container specific code (which contains mustache templates)
        log.debug(`Skipping mustaching of ${file}`)
        continue
      }
      log.debug(`Mustaching ${file}`)
      const pathToFile = path.join(config.outDir, file)
      await mustacheUtils.mustacheRenderToOutputFileUsingTemplateFile(
        pathToFile,
        mustacheView,
        pathToFile
      )
    }

    log.debug('Creating miniapp activities')
    for (const miniApp of config.miniApps) {
      const activityFileName = `${miniApp.pascalCaseName}Activity.java`

      log.debug(`Creating ${activityFileName}`)
      const pathToMiniAppActivityMustacheTemplate = path.join(
        PATH_TO_TEMPLATES_DIR,
        'MiniAppActivity.mustache'
      )
      const pathToOutputActivityFile = path.join(
        config.outDir,
        pathLibSrcMainJavaComWalmartlabsErnContainer,
        'miniapps',
        activityFileName
      )
      await mustacheUtils.mustacheRenderToOutputFileUsingTemplateFile(
        pathToMiniAppActivityMustacheTemplate,
        miniApp,
        pathToOutputActivityFile
      )
    }
  }

  public async addAndroidPluginHookClasses(
    plugins: PackagePath[],
    outDir: string
  ): Promise<any> {
    for (const plugin of plugins) {
      if (plugin.basePath === 'react-native') {
        continue
      }
      const pluginConfig = await manifest.getPluginConfig(plugin)
      if (!pluginConfig.android) {
        log.warn(
          `Skipping ${
            plugin.basePath
          } as it does not have an Android configuration`
        )
        continue
      }
      const androidPluginHook = pluginConfig.android.pluginHook
      if (androidPluginHook) {
        log.debug(`Adding ${androidPluginHook.name}.java`)
        if (!pluginConfig.path) {
          throw new Error('No plugin config path was set. Cannot proceed.')
        }
        const pathToPluginConfigHook = path.join(
          pluginConfig.path,
          `${androidPluginHook.name}.java`
        )
        const pathToCopyPluginConfigHookTo = path.join(
          outDir,
          'lib',
          'src',
          'main',
          'java',
          'com',
          'walmartlabs',
          'ern',
          'container',
          'plugins'
        )
        shell.cp(pathToPluginConfigHook, pathToCopyPluginConfigHookTo)
      }
    }
  }

  public async buildAndroidPluginsViews(
    plugins: PackagePath[],
    mustacheView: any
  ): Promise<any> {
    mustacheView.plugins = await generatePluginsMustacheViews(
      plugins,
      'android'
    )
    mustacheView.pluginCompile = []
    const reactNativePlugin = _.find(
      plugins,
      p => p.basePath === 'react-native'
    )
    if (reactNativePlugin) {
      log.debug(
        `Will inject: compile 'com.walmartlabs.ern:react-native:${
          reactNativePlugin.version
        }'`
      )
      mustacheView.pluginCompile.push({
        compileStatement: `compile 'com.walmartlabs.ern:react-native:${
          reactNativePlugin.version
        }'`,
      })
    }
    const reactNativeCodePushPlugin = _.find(
      plugins,
      p => p.basePath === 'react-native-code-push'
    )
    if (reactNativeCodePushPlugin) {
      mustacheView.loadJsBundleFromCustomPath = true
    }
  }
}
