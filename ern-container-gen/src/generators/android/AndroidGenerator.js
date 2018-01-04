// @flow

import {
  manifest,
  handleCopyDirective,
  MavenUtils,
  MiniApp,
  utils as coreUtils,
  mustacheUtils,
  Dependency,
  shell
} from 'ern-core'
import {
  bundleMiniApps,
  publishContainerToGit,
  generatePluginsMustacheViews,
  copyRnpmAssets
} from '../../utils.js'
import _ from 'lodash'
import path from 'path'
import readDir from 'fs-readdir-recursive'
import type {
  ContainerGenerator,
  ContainerGeneratorPaths
} from '../../FlowTypes'
import ContainerGeneratorConfig from '../../ContainerGeneratorConfig'
import populateApiImplMustacheView from '../ApiImplMustacheUtil'

const ROOT_DIR = process.cwd()
const DEFAULT_NAMESPACE = 'com.walmartlabs.ern'
const PATH_TO_TEMPLATES_DIR = path.join(__dirname, 'templates')
const PATH_TO_HULL_DIR = path.join(__dirname, 'hull')

export default class AndroidGenerator implements ContainerGenerator {
  _containerGeneratorConfig : ContainerGeneratorConfig
  _namespace : string

  constructor ({
    containerGeneratorConfig,
    namespace = DEFAULT_NAMESPACE
   } : {
    containerGeneratorConfig: ContainerGeneratorConfig,
    namespace?: string
   } = {}) {
    this._containerGeneratorConfig = containerGeneratorConfig
    this._namespace = namespace
  }

  get name () : string {
    return 'AndroidGenerator'
  }

  get platform (): string {
    return 'android'
  }

  get namespace () : string {
    return this._namespace
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
    } = {}) {
    try {
      shell.cd(paths.outDirectory)

      const mavenPublisher = this._containerGeneratorConfig.firstAvailableMavenPublisher
      if (this._containerGeneratorConfig.shouldPublish() && mavenPublisher) {
        log.debug(`Container will be published to ${mavenPublisher.url}`)
        if (MavenUtils.isLocalMavenRepo(mavenPublisher.url)) {
          MavenUtils.createLocalMavenDirectoryIfDoesNotExist()
        }
      } else {
        log.debug('Something does not look right, android should always have a default maven publisher.')
      }

      mustacheView.android = {
        repository: mavenPublisher ? MavenUtils.targetRepositoryGradleStatement(mavenPublisher.url) : undefined,
        namespace: this.namespace
      }

      await this.fillContainerHull(plugins, miniapps, paths, mustacheView)

      const jsApiImplDependencies = await coreUtils.extractJsApiImplementations(plugins)

      await bundleMiniApps(miniapps, paths, 'android', {pathToYarnLock}, jsApiImplDependencies)

      if (!this._containerGeneratorConfig.ignoreRnpmAssets) {
        copyRnpmAssets(miniapps, paths)
      }

      if (mavenPublisher && !process.env['SYSTEM_TESTS']) {
        await mavenPublisher.publish({workingDir: paths.outDirectory, moduleName: `lib`})
        log.debug(`Published com.walmartlabs.ern:${nativeAppName}-ern-container:${containerVersion}`)
        log.debug(`To ${mavenPublisher.url}`)
      }

      const gitHubPublisher = this._containerGeneratorConfig.firstAvailableGitHubPublisher
      if (gitHubPublisher) {
        log.debug('Publishing container to git')
        await publishContainerToGit(paths.outDirectory, containerVersion, gitHubPublisher)
      }
    } catch (e) {
      log.error(`[generateContainer] Something went wrong. Aborting Container Generation`)
      throw e
    }
  }

  async fillContainerHull (
    plugins: Array<Dependency>,
    miniApps: Array<MiniApp>,
    paths: any,
    mustacheView: any) : Promise<*> {
    try {
      log.debug(`[=== Starting container hull filling ===]`)

      shell.cd(ROOT_DIR)

      const copyFromPath = path.join(PATH_TO_HULL_DIR, '{.*,*}')

      shell.cp('-R', copyFromPath, paths.outDirectory)

      await this.buildAndroidPluginsViews(plugins, mustacheView)
      await this.addAndroidPluginHookClasses(plugins, paths)

      for (const plugin of plugins) {
        if (await coreUtils.isDependencyJsApiImpl(plugin.name)) {
          log.debug('JS api implementation identified, skipping fill hull.')
          continue
        }

        let pluginConfig = await manifest.getPluginConfig(plugin)
        let pluginSourcePath
        if (plugin.name === 'react-native') { continue }
        if (!pluginConfig.android) {
          log.warn(`Skipping ${plugin.name} as it does not have an Android configuration`)
          continue
        }

        shell.cd(paths.pluginsDownloadDirectory)
        pluginSourcePath = await coreUtils.downloadPluginSource(pluginConfig.origin)
        if (!pluginSourcePath) {
          throw new Error(`Was not able to download ${plugin.name}`)
        }

        if (await coreUtils.isDependencyNativeApiImpl(plugin.scopedName)) {
          populateApiImplMustacheView(pluginSourcePath, mustacheView, true)
        }

        const pathToPluginProject = path.join(pluginSourcePath, pluginConfig.android.root)
        shell.cd(pathToPluginProject)

        const relPathToPluginSource = pluginConfig.android.moduleName
          ? path.join(pluginConfig.android.moduleName, 'src', 'main', 'java')
          : path.join('src', 'main', 'java')
        const absPathToCopyPluginSourceTo = path.join(paths.outDirectory, 'lib', 'src', 'main')
        shell.cp('-R', relPathToPluginSource, absPathToCopyPluginSourceTo)

        if (pluginConfig.android) {
          if (pluginConfig.android.copy) {
            handleCopyDirective(pluginSourcePath, paths.outDirectory, pluginConfig.android.copy)
          }

          if (pluginConfig.android.dependencies) {
            for (const dependency of pluginConfig.android.dependencies) {
              log.debug(`Adding compile '${dependency}'`)
              mustacheView.pluginCompile.push({
                'compileStatement': `compile '${dependency}'`
              })
            }
          }
        }
      }

      log.debug(`Patching hull`)
      const files = readDir(paths.outDirectory, (f) => (!f.endsWith('.jar') && !f.endsWith('.aar') && !f.endsWith('.git')))
      const pathLibSrcMain = path.join('lib', 'src', 'main')
      const pathLibSrcMainAssets = path.join('lib', 'src', 'main', 'assets')
      const pathLibSrcMainJavaCom = path.join(pathLibSrcMain, 'java', 'com')
      const pathLibSrcMainJavaComWalmartlabsErnContainer = path.join(pathLibSrcMainJavaCom, 'walmartlabs', 'ern', 'container')
      for (const file of files) {
        if ((file.startsWith(pathLibSrcMainJavaCom) && !file.startsWith(pathLibSrcMainJavaComWalmartlabsErnContainer)) ||
          file.startsWith(pathLibSrcMainAssets)) {
          // We don't want to Mustache process library files. It can lead to bad things
          // We also don't want to process assets files ...
          // We just want to process container specific code (which contains mustache templates)
          log.debug(`Skipping mustaching of ${file}`)
          continue
        }
        log.debug(`Mustaching ${file}`)
        const pathToFile = path.join(paths.outDirectory, file)
        await mustacheUtils.mustacheRenderToOutputFileUsingTemplateFile(pathToFile, mustacheView, pathToFile)
      }

      log.debug(`Creating miniapp activities`)
      for (const miniApp of miniApps) {
        let activityFileName = `${miniApp.pascalCaseName}Activity.java`

        log.debug(`Creating ${activityFileName}`)
        const pathToMiniAppActivityMustacheTemplate = path.join(PATH_TO_TEMPLATES_DIR, 'MiniAppActivity.mustache')
        const pathToOutputActivityFile = path.join(paths.outDirectory, pathLibSrcMainJavaComWalmartlabsErnContainer, 'miniapps', activityFileName)
        await mustacheUtils.mustacheRenderToOutputFileUsingTemplateFile(
            pathToMiniAppActivityMustacheTemplate,
            miniApp,
            pathToOutputActivityFile)
      }

      log.debug(`[=== Completed container hull filling ===]`)
    } catch (e) {
      log.error('[fillContainerHull] Something went wrong: ' + e)
      throw e
    }
  }

  async addAndroidPluginHookClasses (
    plugins: Array<Dependency>,
    paths: any) : Promise<*> {
    try {
      log.debug(`[=== Adding plugin hook classes ===]`)

      for (const plugin of plugins) {
        if (plugin.name === 'react-native') { continue }
        let pluginConfig = await manifest.getPluginConfig(plugin)
        if (!pluginConfig.android) {
          log.warn(`Skipping ${plugin.name} as it does not have an Android configuration`)
          continue
        }
        let androidPluginHook = pluginConfig.android.pluginHook
        if (androidPluginHook) {
          log.debug(`Adding ${androidPluginHook.name}.java`)
          if (!pluginConfig.path) {
            throw new Error('No plugin config path was set. Cannot proceed.')
          }
          const pathToPluginConfigHook = path.join(pluginConfig.path, `${androidPluginHook.name}.java`)
          const pathToCopyPluginConfigHookTo =
            path.join(paths.outDirectory, 'lib', 'src', 'main', 'java', 'com', 'walmartlabs', 'ern', 'container', 'plugins')
          shell.cp(pathToPluginConfigHook, pathToCopyPluginConfigHookTo)
        }
      }

      log.debug('[=== Done adding plugin hook classes ===]')
    } catch (e) {
      log.error('[addAndroidPluginHookClasses] Something went wrong: ' + e)
      throw e
    }
  }

  async buildAndroidPluginsViews (
    plugins: Array<Dependency>,
    mustacheView: any) : Promise<*> {
    try {
      mustacheView.plugins = await generatePluginsMustacheViews(plugins, 'android')
      mustacheView.pluginCompile = []
      const reactNativePlugin = _.find(plugins, p => p.name === 'react-native')
      if (reactNativePlugin) {
        log.debug(`Will inject: compile 'com.walmartlabs.ern:react-native:${reactNativePlugin.version}'`)
        mustacheView.pluginCompile.push({
          'compileStatement': `compile 'com.walmartlabs.ern:react-native:${reactNativePlugin.version}'`
        })
      }
    } catch (e) {
      log.error('[buildAndroidPluginsViews] Something went wrong: ' + e)
      throw e
    }
  }
}
