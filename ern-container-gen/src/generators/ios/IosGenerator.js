// @flow

import {
  manifest,
  IosUtil,
  utils,
  PackagePath,
  shell
} from 'ern-core'
import {
  bundleMiniApps,
  generatePluginsMustacheViews,
  copyRnpmAssets,
  injectReactNativeVersionKeysInObject,
  sortDependenciesByName
} from '../../utils.js'
import fs from 'fs'
import path from 'path'
import xcode from 'xcode-ern'
import readDir from 'fs-readdir-recursive'
import type {
  ContainerGenerator,
  ContainerGeneratorConfig
} from '../../FlowTypes'
import populateApiImplMustacheView from '../ApiImplMustacheUtil'
import _ from 'lodash'

const ROOT_DIR = process.cwd()
const PATH_TO_HULL_DIR = path.join(__dirname, 'hull')

export default class IosGenerator implements ContainerGenerator {
  get name () : string {
    return 'IosGenerator'
  }

  get platform () : string {
    return 'ios'
  }

  prepareDirectories (config: ContainerGeneratorConfig) {
    if (!fs.existsSync(config.outDir)) {
      shell.mkdir('-p', config.outDir)
    } else {
      shell.rm('-rf', path.join(config.outDir, '*'))
    }

    if (!fs.existsSync(config.compositeMiniAppDir)) {
      shell.mkdir('-p', config.compositeMiniAppDir)
    } else {
      shell.rm('-rf', path.join(config.compositeMiniAppDir, '*'))
    }

    if (!fs.existsSync(config.pluginsDownloadDir)) {
      shell.mkdir('-p', config.pluginsDownloadDir)
    } else {
      shell.rm('-rf', path.join(config.pluginsDownloadDir, '*'))
    }
  }

  async generate (config: ContainerGeneratorConfig) : Promise<void> {
    try {
      this.prepareDirectories(config)
      config.plugins = sortDependenciesByName(config.plugins)

      shell.cd(config.outDir)

      await this.fillContainerHull(config)

      if (config.miniApps.length > 0) {
        const jsApiImplDependencies = await utils.extractJsApiImplementations(config.plugins)
        await bundleMiniApps(
          config.miniApps,
          config.compositeMiniAppDir,
          config.outDir,
          'ios',
          { pathToYarnLock: config.pathToYarnLock },
          jsApiImplDependencies)
      }

      if (!config.ignoreRnpmAssets) {
        await copyRnpmAssets(config.miniApps, config.compositeMiniAppDir, config.outDir)
        this.addResources(config.outDir)
      }

      log.debug('Container generation completed!')
    } catch (e) {
      log.error('[generateContainer] Something went wrong. Aborting Container Generation')
      throw e
    }
  }

  async addResources (outputDirectory: any) {
    log.debug('=== ios: adding resources for miniapps')
    const containerProjectPath = path.join(outputDirectory, 'ElectrodeContainer.xcodeproj', 'project.pbxproj')
    const containerIosProject = await this.getIosContainerProject(containerProjectPath)

    const containerResourcesPath = path.join(outputDirectory, 'ElectrodeContainer', 'Resources')
    readDir(containerResourcesPath, resourceFile => {
      containerIosProject.addResourceFile(path.join('Resources', resourceFile), null, containerIosProject.findPBXGroupKey({name: 'Resources'}))
    })
    log.debug('---iOS: Finished adding resource files.')

    fs.writeFileSync(containerProjectPath, containerIosProject.writeSync())
  }

  async fillContainerHull (config: ContainerGeneratorConfig) : Promise<void> {
    const pathSpec = {
      rootDir: ROOT_DIR,
      projectHullDir: path.join(PATH_TO_HULL_DIR, '{.*,*}'),
      outputDir: config.outDir,
      pluginsDownloadDirectory: config.pluginsDownloadDir
    }

    const projectSpec = {
      projectName: 'ElectrodeContainer'
    }

    const reactNativePlugin = _.find(config.plugins, p => p.basePath === 'react-native')
    if (!reactNativePlugin) {
      throw new Error('react-native was not found in plugins list !')
    }

    const mustacheView = {}
    injectReactNativeVersionKeysInObject(mustacheView, reactNativePlugin.version)
    await this.buildiOSPluginsViews(config.plugins, mustacheView)
    await this.buildApiImplPluginViews(config.plugins, mustacheView, pathSpec, projectSpec)

    const {iosProject, projectPath} = await IosUtil.fillProjectHull(pathSpec, projectSpec, config.plugins, mustacheView)

    await this.addiOSPluginHookClasses(iosProject, config.plugins, config.outDir)
    fs.writeFileSync(projectPath, iosProject.writeSync())

    log.debug('[=== Completed container hull filling ===]')
  }

  // Code to keep backward compatibility
  switchToOldDirectoryStructure (pluginSourcePath: string, tail: string): boolean {
    // This is to check if the api referenced during container generation is created using the old or new directory structure to help keep the backward compatibility.
    const pathToSwaggersAPIs = path.join('IOS', 'IOS', 'Classes', 'SwaggersAPIs')
    if (path.dirname(tail) === 'IOS' && fs.existsSync(path.join(pluginSourcePath, path.dirname(pathToSwaggersAPIs)))) {
      return true
    }
    return false
  }

  async buildiOSPluginsViews (
    plugins: Array<PackagePath>,
    mustacheView: any) : Promise<*> {
    try {
      mustacheView.plugins = await generatePluginsMustacheViews(plugins, 'ios')
    } catch (e) {
      log.error('[buildiOSPluginsViews] Something went wrong: ' + e)
      throw e
    }
  }

  async addiOSPluginHookClasses (
    containerIosProject: any,
    plugins: Array<PackagePath>,
    outDir: string) : Promise<*> {
    try {
      log.debug('[=== iOS: Adding plugin hook classes ===]')

      for (const plugin of plugins) {
        if (plugin.name === 'react-native') { continue }
        let pluginConfig = await manifest.getPluginConfig(plugin)
        if (!pluginConfig.ios) {
          log.warn(`${plugin.basePath} does not have any injection configuration for iOS`)
          continue
        }
        let iOSPluginHook = pluginConfig.ios.pluginHook
        if (iOSPluginHook && iOSPluginHook.name) {
          if (!pluginConfig.path) {
            throw new Error('No plugin config path was set. Cannot proceed.')
          }

          const pluginConfigPath = pluginConfig.path
          const pathToCopyPluginHooksTo = path.join(outDir, 'ElectrodeContainer')

          log.debug(`Adding ${iOSPluginHook.name}.h`)
          const pathToPluginHookHeader = path.join(pluginConfigPath, `${iOSPluginHook.name}.h`)
          shell.cp(pathToPluginHookHeader, pathToCopyPluginHooksTo)
          containerIosProject.addHeaderFile(`${iOSPluginHook.name}.h`, { public: true }, containerIosProject.findPBXGroupKey({name: 'ElectrodeContainer'}))

          log.debug(`Adding ${iOSPluginHook.name}.m`)
          const pathToPluginHookSource = path.join(pluginConfigPath, `${iOSPluginHook.name}.m`)
          shell.cp(pathToPluginHookSource, pathToCopyPluginHooksTo)
          containerIosProject.addSourceFile(`${iOSPluginHook.name}.m`, null, containerIosProject.findPBXGroupKey({name: 'ElectrodeContainer'}))
        }
      }

      log.debug('[=== iOS: Done adding plugin hook classes ===]')
    } catch (e) {
      log.error(`[addiOSPluginHookClasses] Something went wrong: ${e}`)
      throw e
    }
  }

  async getIosContainerProject (containerProjectPath: string) : Promise<*> {
    const containerProject = xcode.project(containerProjectPath)
    return new Promise((resolve, reject) => {
      containerProject.parse(function (err) {
        if (err) {
          reject(err)
        }
        resolve(containerProject)
      })
    })
  }

  async buildApiImplPluginViews (plugins: Array<PackagePath>,
                                 mustacheView: Object,
                                 pathSpec: Object,
                                 projectSpec: Object) {
    for (const plugin of plugins) {
      const pluginConfig = await manifest.getPluginConfig(plugin, projectSpec.projectName)
      shell.cd(pathSpec.pluginsDownloadDirectory)
      if (await utils.isDependencyApiImpl(plugin.basePath)) {
        const pluginSourcePath = await utils.downloadPluginSource(pluginConfig.origin)
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
