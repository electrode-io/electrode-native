// @flow

import {
  manifest,
  handleCopyDirective,
  MiniApp,
  IosUtil,
  utils,
  Dependency,
  shell
} from 'ern-core'
import {
  bundleMiniApps,
  publishContainerToGit
} from '../../utils.js'
import fs from 'fs'
import path from 'path'
import xcode from 'xcode-ern'
import readDir from 'fs-readdir-recursive'
import type {
  ContainerGenerator,
  ContainerGeneratorPaths
} from '../../FlowTypes'
import populateApiImplMustacheView from '../ApiImplMustacheUtil'
import ContainerGeneratorConfig from '../../ContainerGeneratorConfig'

const ROOT_DIR = process.cwd()
const PATH_TO_HULL_DIR = path.join(__dirname, 'hull')

export default class IosGenerator implements ContainerGenerator {
  _containerGeneratorConfig : ContainerGeneratorConfig

  constructor (containerGeneratorConfig: ContainerGeneratorConfig) {
    this._containerGeneratorConfig = containerGeneratorConfig
  }

  get name () : string {
    return 'IosGenerator'
  }

  get platform () : string {
    return 'ios'
  }

  async generateContainer (
    containerVersion: string,
    nativeAppName: string,
    plugins: Array<Dependency>,
    miniapps: Array<MiniApp>,
    paths: ContainerGeneratorPaths,
    mustacheView: any, {
      pathToYarnLock
    } : {
      pathToYarnLock?: string
    } = {}) : Promise<*> {
    try {
      shell.cd(paths.outDirectory)

      await this.fillContainerHull(plugins, miniapps, paths, mustacheView)

      if (miniapps.length > 0) {
        const jsApiImplDependencies = await utils.extractJsApiImplementations(plugins)
        await bundleMiniApps(miniapps, paths, 'ios', {pathToYarnLock}, jsApiImplDependencies)
      }

      if (!this._containerGeneratorConfig.ignoreRnpmAssets) {
        await this.copyRnpmAssets(miniapps, paths)
      }

      const gitHubPublisher = this._containerGeneratorConfig.firstAvailableGitHubPublisher
      if (gitHubPublisher) {
        log.debug('Publishing container to git')
        await publishContainerToGit(paths.outDirectory, containerVersion, gitHubPublisher)
      }

      log.debug(`Container generation completed!`)
    } catch (e) {
      log.error(`[generateContainer] Something went wrong. Aborting Container Generation`)
      throw e
    }
  }

  async copyRnpmAssets (
    miniApps: Array<MiniApp>,
    paths: any) {
    // Case of local container for runner
    if ((miniApps.length === 1) && (miniApps[0].path)) {
      this.copyRnpmAssetsFromMiniAppPath(miniApps[0].path, paths.outDirectory)
    } else {
      for (const miniApp of miniApps) {
        const miniAppPath = path.join(
          paths.compositeMiniApp,
          'node_modules',
          miniApp.packageJson.name)
        this.copyRnpmAssetsFromMiniAppPath(miniAppPath, paths.outDirectory)
      }
    }
    return this.addResources(paths.outDirectory)
  }

  async addResources (outputDirectory: any) {
    log.debug(`=== ios: adding resources for miniapps`)
    const containerProjectPath = path.join(outputDirectory, 'ElectrodeContainer.xcodeproj', 'project.pbxproj')
    const containerIosProject = await this.getIosContainerProject(containerProjectPath)

    const containerResourcesPath = path.join(outputDirectory, 'ElectrodeContainer', 'Resources')
    readDir(containerResourcesPath, resourceFile => {
      containerIosProject.addResourceFile(path.join('Resources', resourceFile), null, containerIosProject.findPBXGroupKey({name: 'Resources'}))
    })
    log.debug(`---iOS: Finished adding resource files. `)

    fs.writeFileSync(containerProjectPath, containerIosProject.writeSync())
  }

  copyRnpmAssetsFromMiniAppPath (miniAppPath: string, outputPath: string) {
    const packageJson = JSON.parse(fs.readFileSync(path.join(miniAppPath, 'package.json'), 'utf-8'))
    if (packageJson.rnpm && packageJson.rnpm.assets) {
      for (const assetDirectoryName of packageJson.rnpm.assets) {
        const source = path.join(assetDirectoryName, '*')
        const dest = path.join('ElectrodeContainer', 'Resources')
        handleCopyDirective(miniAppPath, outputPath, [{ source, dest }])
      }
    }
  }

  async fillContainerHull (
    plugins: Array<Dependency>,
    miniApps: Array<MiniApp>,
    paths: any,
    mustacheView: any) : Promise<*> {
    const pathSpec = {
      rootDir: ROOT_DIR,
      projectHullDir: path.join(PATH_TO_HULL_DIR, '{.*,*}'),
      outputDir: paths.outDirectory,
      pluginsDownloadDirectory: paths.pluginsDownloadDirectory
    }

    const projectSpec = {
      projectName: 'ElectrodeContainer'
    }

    await this.buildiOSPluginsViews(plugins, mustacheView)
    await this.buildApiImplPluginViews(plugins, mustacheView, pathSpec, projectSpec)

    const {iosProject, projectPath} = await IosUtil.fillProjectHull(pathSpec, projectSpec, plugins, mustacheView)

    await this.addiOSPluginHookClasses(iosProject, plugins, paths)
    fs.writeFileSync(projectPath, iosProject.writeSync())

    log.debug(`[=== Completed container hull filling ===]`)
  }

  // Code to keep backward compatibility
  switchToOldDirectoryStructure (pluginSourcePath: string, tail: string): boolean {
    // This is to check if the api referenced during container generation is created using the old or new directory structure to help keep the backward compatibility.
    const pathToSwaggersAPIs = path.join('IOS', 'IOS', 'Classes', 'SwaggersAPIs')
    if (path.dirname(tail) === `IOS` && fs.existsSync(path.join(pluginSourcePath, path.dirname(pathToSwaggersAPIs)))) {
      return true
    }
    return false
  }

  async buildiOSPluginsViews (
    plugins: Array<Dependency>,
    mustacheView: any) : Promise<*> {
    try {
      let pluginsView = []
      log.debug(`===iOS: building iOS plugin views`)
      for (const plugin of plugins) {
        if (plugin.name === 'react-native') {
          continue
        }
        let pluginConfig = await manifest.getPluginConfig(plugin)
        if (!pluginConfig.ios) {
          log.warn(`${plugin.name} does not have any injection configuration for iOS`)
          continue
        }
        let iosPluginHook = pluginConfig.ios.pluginHook
        let containerHeader = pluginConfig.ios.containerPublicHeader
        if (iosPluginHook.configurable) {
          pluginsView.push({
            'name': iosPluginHook.name,
            'lcname': iosPluginHook.name.charAt(0).toLowerCase() + iosPluginHook.name.slice(1),
            'configurable': iosPluginHook.configurable,
            'containerHeader': containerHeader
          })
        } else {
          pluginsView.push({
            'configurable': iosPluginHook.configurable,
            'containerHeader': containerHeader
          })
        }
      }

      mustacheView.plugins = pluginsView
    } catch (e) {
      log.error('[buildiOSPluginsViews] Something went wrong: ' + e)
      throw e
    }
  }

  async addiOSPluginHookClasses (
    containerIosProject: any,
    plugins: Array<Dependency>,
    paths: any) : Promise<*> {
    try {
      log.debug(`[=== iOS: Adding plugin hook classes ===]`)

      for (const plugin of plugins) {
        if (plugin.name === 'react-native') { continue }
        let pluginConfig = await manifest.getPluginConfig(plugin)
        if (!pluginConfig.ios) {
          log.warn(`${plugin.name} does not have any injection configuration for iOS`)
          continue
        }
        let iOSPluginHook = pluginConfig.ios.pluginHook
        if (iOSPluginHook) {
          if (iOSPluginHook.header) {
            log.debug(`Adding ${iOSPluginHook.name}.h`)
            if (!pluginConfig.path) {
              throw new Error(`No plugin config path was set. Cannot proceed.`)
            }
            const pathToPluginHookHeader = path.join(pluginConfig.path, `${iOSPluginHook.name}.h`)
            const pathToCopyPluginHookHeaderTo = path.join(paths.outDirectory, 'ElectrodeContainer')
            shell.cp(pathToPluginHookHeader, pathToCopyPluginHookHeaderTo)
            containerIosProject.addHeaderFile(`${iOSPluginHook.name}.h`, { public: true }, containerIosProject.findPBXGroupKey({name: 'ElectrodeContainer'}))
            containerIosProject.addSourceFile(`${iOSPluginHook.name}.m`, null, containerIosProject.findPBXGroupKey({name: 'ElectrodeContainer'}))
          }

          if (iOSPluginHook.source) {
            log.debug(`Adding ${iOSPluginHook.name}.m`)
            if (!pluginConfig.path) {
              throw new Error(`No plugin config path was set. Cannot proceed.`)
            }
            const pathToPluginHookSource = path.join(pluginConfig.path, `${iOSPluginHook.name}.m`)
            const pathToCopyPluginHookSourceTo = path.join(paths.outDirectory, 'ElectrodeContainer')
            shell.cp(pathToPluginHookSource, pathToCopyPluginHookSourceTo)
          }
        }
      }

      log.debug(`[=== iOS: Done adding plugin hook classes ===]`)
    } catch (e) {
      log.error('[addiOSPluginHookClasses] Something went wrong: ' + e)
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

  async buildApiImplPluginViews (plugins: Array<Dependency>,
                                 mustacheView: Object,
                                 pathSpec: Object,
                                 projectSpec: Object) {
    for (const plugin of plugins) {
      const pluginConfig = await manifest.getPluginConfig(plugin, projectSpec.projectName)
      shell.cd(pathSpec.pluginsDownloadDirectory)
      if (await utils.isDependencyApiImpl(plugin.scopedName)) {
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
