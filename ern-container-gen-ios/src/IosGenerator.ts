import {
  manifest,
  iosUtil,
  utils,
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

import fs from 'fs'
import path from 'path'
import xcode from 'xcode-ern'
import _ from 'lodash'
import readDir from 'fs-readdir-recursive'

const ROOT_DIR = process.cwd()
const PATH_TO_HULL_DIR = path.join(__dirname, 'hull')

export default class IosGenerator implements ContainerGenerator {
  get name(): string {
    return 'IosGenerator'
  }

  get platform(): NativePlatform {
    return 'ios'
  }

  public async generate(
    config: ContainerGeneratorConfig
  ): Promise<ContainerGenResult> {
    prepareDirectories(config)
    config.plugins = sortDependenciesByName(config.plugins)

    shell.cd(config.outDir)

    await this.fillContainerHull(config)

    const jsApiImplDependencies = await utils.extractJsApiImplementations(
      config.plugins
    )
    const bundlingResult: BundlingResult = await kax
      .task('Bundling MiniApps')
      .run(
        bundleMiniApps(
          config.miniApps,
          config.compositeMiniAppDir,
          config.outDir,
          'ios',
          { pathToYarnLock: config.pathToYarnLock },
          jsApiImplDependencies
        )
      )

    if (!config.ignoreRnpmAssets) {
      await kax
        .task('Copying rnpm assets -if any-')
        .run(
          copyRnpmAssets(
            config.miniApps,
            config.compositeMiniAppDir,
            config.outDir,
            'ios'
          )
        )
      this.addResources(config.outDir)
    }

    await kax
      .task('Adding Electrode Native Metadata File')
      .run(addElectrodeNativeMetadataFile(config))

    log.debug('Container generation completed!')

    return {
      bundlingResult,
    }
  }

  public async addResources(outputDirectory: any) {
    const containerProjectPath = path.join(
      outputDirectory,
      'ElectrodeContainer.xcodeproj',
      'project.pbxproj'
    )
    const containerIosProject = await this.getIosContainerProject(
      containerProjectPath
    )

    const containerResourcesPath = path.join(
      outputDirectory,
      'ElectrodeContainer',
      'Resources'
    )
    const resourceFiles = readDir(containerResourcesPath)
    resourceFiles.forEach(resourceFile => {
      containerIosProject.addResourceFile(
        path.join('Resources', resourceFile),
        null,
        containerIosProject.findPBXGroupKey({ name: 'Resources' })
      )
    })

    fs.writeFileSync(containerProjectPath, containerIosProject.writeSync())
  }

  public async fillContainerHull(
    config: ContainerGeneratorConfig
  ): Promise<void> {
    const pathSpec = {
      outputDir: config.outDir,
      pluginsDownloadDirectory: config.pluginsDownloadDir,
      projectHullDir: path.join(PATH_TO_HULL_DIR, '{.*,*}'),
      rootDir: ROOT_DIR,
    }

    const projectSpec = {
      projectName: 'ElectrodeContainer',
    }

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

    const mustacheView = {}
    injectReactNativeVersionKeysInObject(
      mustacheView,
      reactNativePlugin.version
    )

    await kax
      .task('Preparing Native Dependencies Injection')
      .run(this.buildiOSPluginsViews(config.plugins, mustacheView))

    await kax
      .task('Preparing API Implementations Injection')
      .run(
        this.buildApiImplPluginViews(
          config.plugins,
          mustacheView,
          pathSpec,
          projectSpec
        )
      )
    const { iosProject, projectPath } = await iosUtil.fillProjectHull(
      pathSpec,
      projectSpec,
      config.plugins,
      mustacheView
    )

    await kax
      .task('Adding Native Dependencies Hooks')
      .run(
        this.addiOSPluginHookClasses(iosProject, config.plugins, config.outDir)
      )

    fs.writeFileSync(projectPath, iosProject.writeSync())
  }

  // Code to keep backward compatibility
  public switchToOldDirectoryStructure(
    pluginSourcePath: string,
    tail: string
  ): boolean {
    // This is to check if the api referenced during container generation is created using the old or new directory structure to help keep the backward compatibility.
    const pathToSwaggersAPIs = path.join(
      'IOS',
      'IOS',
      'Classes',
      'SwaggersAPIs'
    )
    if (
      path.dirname(tail) === 'IOS' &&
      fs.existsSync(
        path.join(pluginSourcePath, path.dirname(pathToSwaggersAPIs))
      )
    ) {
      return true
    }
    return false
  }

  public async buildiOSPluginsViews(
    plugins: PackagePath[],
    mustacheView: any
  ): Promise<any> {
    mustacheView.plugins = await generatePluginsMustacheViews(plugins, 'ios')
  }

  public async addiOSPluginHookClasses(
    containerIosProject: any,
    plugins: PackagePath[],
    outDir: string
  ): Promise<any> {
    for (const plugin of plugins) {
      if (plugin.basePath === 'react-native') {
        continue
      }
      const pluginConfig = await manifest.getPluginConfig(plugin)
      if (!pluginConfig.ios) {
        log.warn(
          `${
            plugin.basePath
          } does not have any injection configuration for ios platform`
        )
        continue
      }
      const iOSPluginHook = pluginConfig.ios.pluginHook
      if (iOSPluginHook && iOSPluginHook.name) {
        if (!pluginConfig.path) {
          throw new Error('No plugin config path was set. Cannot proceed.')
        }

        const pluginConfigPath = pluginConfig.path
        const pathToCopyPluginHooksTo = path.join(outDir, 'ElectrodeContainer')

        log.debug(`Adding ${iOSPluginHook.name}.h`)
        const pathToPluginHookHeader = path.join(
          pluginConfigPath,
          `${iOSPluginHook.name}.h`
        )
        shell.cp(pathToPluginHookHeader, pathToCopyPluginHooksTo)
        containerIosProject.addHeaderFile(
          `${iOSPluginHook.name}.h`,
          { public: true },
          containerIosProject.findPBXGroupKey({ name: 'ElectrodeContainer' })
        )

        log.debug(`Adding ${iOSPluginHook.name}.m`)
        const pathToPluginHookSource = path.join(
          pluginConfigPath,
          `${iOSPluginHook.name}.m`
        )
        shell.cp(pathToPluginHookSource, pathToCopyPluginHooksTo)
        containerIosProject.addSourceFile(
          `${iOSPluginHook.name}.m`,
          null,
          containerIosProject.findPBXGroupKey({ name: 'ElectrodeContainer' })
        )
      }
    }
  }

  public async getIosContainerProject(
    containerProjectPath: string
  ): Promise<any> {
    const containerProject = xcode.project(containerProjectPath)
    return new Promise((resolve, reject) => {
      containerProject.parse(err => {
        if (err) {
          reject(err)
        }
        resolve(containerProject)
      })
    })
  }

  public async buildApiImplPluginViews(
    plugins: PackagePath[],
    mustacheView: any,
    pathSpec: any,
    projectSpec: any
  ) {
    for (const plugin of plugins) {
      const pluginConfig = await manifest.getPluginConfig(
        plugin,
        projectSpec.projectName
      )
      shell.cd(pathSpec.pluginsDownloadDirectory)
      if (await utils.isDependencyApiImpl(plugin.basePath)) {
        const pluginSourcePath = await utils.downloadPluginSource(
          pluginConfig.origin
        )
        populateApiImplMustacheView(pluginSourcePath, mustacheView, true)
      }
    }

    if (mustacheView.apiImplementations) {
      mustacheView.hasApiImpl = true
      for (const api of mustacheView.apiImplementations) {
        if (api.hasConfig) {
          mustacheView.hasAtleastOneApiImplConfig = true
          break
        }
      }
    }
  }
}
