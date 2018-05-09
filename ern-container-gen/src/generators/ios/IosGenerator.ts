import {
  manifest,
  iosUtil,
  utils,
  PackagePath,
  shell,
  BundlingResult,
  log,
} from 'ern-core'
import {
  bundleMiniApps,
  generatePluginsMustacheViews,
  copyRnpmAssets,
  injectReactNativeVersionKeysInObject,
  sortDependenciesByName,
  populateApiImplMustacheView,
  addElectrodeNativeMetadataFile,
  prepareDirectories,
} from '../../utils'
import fs from 'fs'
import path from 'path'
import xcode from 'xcode-ern'
import _ from 'lodash'
import {
  ContainerGenerator,
  ContainerGeneratorConfig,
  ContainerGenResult,
} from '../../FlowTypes'
import readDir from 'fs-readdir-recursive'

const ROOT_DIR = process.cwd()
const PATH_TO_HULL_DIR = path.join(__dirname, 'hull')

export default class IosGenerator implements ContainerGenerator {
  get name(): string {
    return 'IosGenerator'
  }

  get platform(): string {
    return 'ios'
  }

  public async generate(
    config: ContainerGeneratorConfig
  ): Promise<ContainerGenResult> {
    try {
      prepareDirectories(config)
      config.plugins = sortDependenciesByName(config.plugins)

      shell.cd(config.outDir)

      await this.fillContainerHull(config)

      const jsApiImplDependencies = await utils.extractJsApiImplementations(
        config.plugins
      )
      const bundlingResult: BundlingResult = await bundleMiniApps(
        config.miniApps,
        config.compositeMiniAppDir,
        config.outDir,
        'ios',
        { pathToYarnLock: config.pathToYarnLock },
        jsApiImplDependencies
      )

      if (!config.ignoreRnpmAssets) {
        await copyRnpmAssets(
          config.miniApps,
          config.compositeMiniAppDir,
          config.outDir,
          'ios'
        )
        this.addResources(config.outDir)
      }

      await addElectrodeNativeMetadataFile(config)

      log.debug('Container generation completed!')

      return {
        bundlingResult,
      }
    } catch (e) {
      log.error(
        '[generateContainer] Something went wrong. Aborting Container Generation'
      )
      throw e
    }
  }

  public async addResources(outputDirectory: any) {
    log.debug('=== ios: adding resources for miniapps')
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
    log.debug('---iOS: Finished adding resource files.')

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
    await this.buildiOSPluginsViews(config.plugins, mustacheView)
    await this.buildApiImplPluginViews(
      config.plugins,
      mustacheView,
      pathSpec,
      projectSpec
    )

    const { iosProject, projectPath } = await iosUtil.fillProjectHull(
      pathSpec,
      projectSpec,
      config.plugins,
      mustacheView
    )

    await this.addiOSPluginHookClasses(
      iosProject,
      config.plugins,
      config.outDir
    )
    fs.writeFileSync(projectPath, iosProject.writeSync())

    log.debug('[=== Completed container hull filling ===]')
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
    try {
      mustacheView.plugins = await generatePluginsMustacheViews(plugins, 'ios')
    } catch (e) {
      log.error('[buildiOSPluginsViews] Something went wrong: ' + e)
      throw e
    }
  }

  public async addiOSPluginHookClasses(
    containerIosProject: any,
    plugins: PackagePath[],
    outDir: string
  ): Promise<any> {
    try {
      log.debug('[=== iOS: Adding plugin hook classes ===]')

      for (const plugin of plugins) {
        if (plugin.basePath === 'react-native') {
          continue
        }
        const pluginConfig = await manifest.getPluginConfig(plugin)
        if (!pluginConfig.ios) {
          log.warn(
            `${
              plugin.basePath
            } does not have any injection configuration for iOS`
          )
          continue
        }
        const iOSPluginHook = pluginConfig.ios.pluginHook
        if (iOSPluginHook && iOSPluginHook.name) {
          if (!pluginConfig.path) {
            throw new Error('No plugin config path was set. Cannot proceed.')
          }

          const pluginConfigPath = pluginConfig.path
          const pathToCopyPluginHooksTo = path.join(
            outDir,
            'ElectrodeContainer'
          )

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

      log.debug('[=== iOS: Done adding plugin hook classes ===]')
    } catch (e) {
      log.error(`[addiOSPluginHookClasses] Something went wrong: ${e}`)
      throw e
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
