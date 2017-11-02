// @flow

import {
  manifest,
  handleCopyDirective,
  ContainerGeneratorConfig,
  MavenUtils,
  MiniApp,
  utils
} from 'ern-core'
import {
  mustacheUtils,
  Dependency,
  Utils,
  shell,
  gitCli
} from 'ern-util'
import {
  bundleMiniApps,
  capitalizeFirstLetter
} from '../../utils.js'
import _ from 'lodash'
import fs from 'fs'
import path from 'path'
import readDir from 'fs-readdir-recursive'
import type {
  ContainerGenerator,
  ContainerGeneratorPaths
} from '../../FlowTypes'

const ROOT_DIR = process.cwd()
const DEFAULT_NAMESPACE = 'com.walmartlabs.ern'

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

      const gitHubPublisher = this._containerGeneratorConfig.firstAvailableGitHubPublisher
      if (gitHubPublisher) {
        try {
          log.debug(`GitHub publisher found. Lets clone the repo before generating the container.`)
          let repoUrl = gitHubPublisher.url
          log.debug(`\n === Generated container will also be published to github
            targetRepoUrl: ${repoUrl}
            containerVersion: ${containerVersion}`)

          log.debug(`First lets clone the repo so we can update it with the newly generated container`)
          await gitCli().cloneAsync(repoUrl, '.')

          shell.rm('-rf', `${paths.outDirectory}/*`)
        } catch (e) {
          Utils.logErrorAndExitProcess(new Error('Container generation Failed while cloning the repo. \n Check to see if the entered URL is correct'))
        }
      }

      mustacheView.android = {
        repository: mavenPublisher ? MavenUtils.targetRepositoryGradleStatement(mavenPublisher.url) : undefined,
        namespace: this.namespace,
        miniapps: mustacheView.miniApps
      }

      await this.fillContainerHull(plugins, miniapps, paths, mustacheView)

      await bundleMiniApps(miniapps, paths, 'android', {pathToYarnLock})

      if (!this._containerGeneratorConfig.ignoreRnpmAssets) {
        this.copyRnpmAssets(miniapps, paths)
      }

      if (mavenPublisher && !process.env['SYSTEM_TESTS']) {
        await mavenPublisher.publish({workingDir: paths.outDirectory, moduleName: `lib`})
        log.debug(`Published com.walmartlabs.ern:${nativeAppName}-ern-container:${containerVersion}`)
        log.debug(`To ${mavenPublisher.url}`)
      }
      if (gitHubPublisher) {
        shell.cd(paths.outDirectory)
        await gitHubPublisher.publish({commitMessage: `Container v${containerVersion}`, tag: `v${containerVersion}`})
        log.debug(`Code pushed to ${gitHubPublisher.url}`)
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

      const copyFromPath = path.join(paths.containerHull, '{.*,*}')

      shell.cp('-R', copyFromPath, paths.outDirectory)

      await this.buildAndroidPluginsViews(plugins, mustacheView)
      await this.addAndroidPluginHookClasses(plugins, paths)

      for (const plugin of plugins) {
        let pluginConfig = await manifest.getPluginConfig(plugin)
        let pluginSourcePath
        if (plugin.name === 'react-native') { continue }
        if (!pluginConfig.android) {
          log.warn(`Skipping ${plugin.name} as it does not have an Android configuration`)
          continue
        }

        shell.cd(paths.pluginsDownloadDirectory)
        pluginSourcePath = await utils.downloadPluginSource(pluginConfig.origin)
        if (!pluginSourcePath) {
          throw new Error(`Was not able to download ${plugin.name}`)
        }

        if (await utils.isDependencyApiImpl(plugin.name)) {
          this.populateApiImplMustacheView(pluginSourcePath, mustacheView)
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
        let tmpMiniAppView = {
          miniAppName: miniApp.name,
          pascalCaseMiniAppName: capitalizeFirstLetter(miniApp.name.replace(/-/g, ''))
        }

        let activityFileName = `${tmpMiniAppView.pascalCaseMiniAppName}Activity.java`

        log.debug(`Creating ${activityFileName}`)
        const pathToMiniAppActivityMustacheTemplate = path.join(paths.containerTemplates, 'MiniAppActivity.mustache')
        const pathToOutputActivityFile = path.join(paths.outDirectory, pathLibSrcMainJavaComWalmartlabsErnContainer, 'miniapps', activityFileName)
        await mustacheUtils.mustacheRenderToOutputFileUsingTemplateFile(
            pathToMiniAppActivityMustacheTemplate,
            tmpMiniAppView,
            pathToOutputActivityFile)
      }

      log.debug(`[=== Completed container hull filling ===]`)
    } catch (e) {
      log.error('[fillContainerHull] Something went wrong: ' + e)
      throw e
    }
  }

  populateApiImplMustacheView (pluginSourcePath: string, mustacheView: Object) {
    const packageJson = JSON.parse(fs.readFileSync(path.join(pluginSourcePath, 'package.json'), 'utf-8'))
    const containerGenConfig = packageJson.ern.containerGen
    if (containerGenConfig && containerGenConfig.apiNames) {
      mustacheView.apiImplementations = mustacheView.apiImplementations ? mustacheView.apiImplementations : []
      for (const apiName of containerGenConfig.apiNames) {
        let api = {
          apiName,
          hasConfig: containerGenConfig.hasConfig,
          apiVariableName: utils.camelize(apiName, true)
        }
        mustacheView.apiImplementations.push(api)
      }
    } else {
      log.warn(`!!!!! containerGen entry not valid for api implementation, skipping api-impl code gen in container for ${packageJson.name} !!!!`)
    }
  }

  copyRnpmAssets (
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
  }

  copyRnpmAssetsFromMiniAppPath (miniAppPath: string, outputPath: string) {
    const packageJson = JSON.parse(fs.readFileSync(path.join(miniAppPath, 'package.json'), 'utf-8'))
    if (packageJson.rnpm && packageJson.rnpm.assets) {
      for (const assetDirectoryName of packageJson.rnpm.assets) {
        const source = path.join(assetDirectoryName, '*')
        const dest = path.join('lib', 'src', 'main', 'assets', assetDirectoryName.toLowerCase())
        handleCopyDirective(miniAppPath, outputPath, [{ source, dest }])
      }
    }
  }

  async addAndroidPluginHookClasses (
    plugins: Array<Dependency>,
    paths: any) : Promise<*> {
    try {
      log.debug(`[=== Adding plugin hook classes ===]`)

      for (const plugin of plugins) {
        if (plugin.name === 'react-native') { continue }
        log.debug(`Handling ${plugin.name}`)
        let pluginConfig = await manifest.getPluginConfig(plugin)
        if (!pluginConfig.android) {
          log.warn(`Skipping ${plugin.name} as it does not have an Android configuration`)
          continue
        }
        let androidPluginHook = pluginConfig.android.pluginHook
        if (androidPluginHook) {
          log.debug(`Adding ${androidPluginHook.name}.java`)
          if (!pluginConfig.path) {
            throw new Error(`No plugin config path was set. Cannot proceed.`)
          }
          const pathToPluginConfigHook = path.join(pluginConfig.path, `${androidPluginHook.name}.java`)
          const pathToCopyPluginConfigHookTo =
            path.join(paths.outDirectory, 'lib', 'src', 'main', 'java', 'com', 'walmartlabs', 'ern', 'container', 'plugins')
          shell.cp(pathToPluginConfigHook, pathToCopyPluginConfigHookTo)
        }
      }

      log.debug(`[=== Done adding plugin hook classes ===]`)
    } catch (e) {
      log.error('[addAndroidPluginHookClasses] Something went wrong: ' + e)
      throw e
    }
  }

  async buildAndroidPluginsViews (
    plugins: Array<Dependency>,
    mustacheView: any) : Promise<*> {
    try {
      let pluginsView = []

      for (const plugin of plugins) {
        if (plugin.name === 'react-native') {
          continue
        }
        let pluginConfig = await manifest.getPluginConfig(plugin)
        if (!pluginConfig.android) {
          log.warn(`${plugin.name} does not have any injection configuration for Android`)
          continue
        }

        let androidPluginHook = pluginConfig.android.pluginHook
        if (androidPluginHook) {
          log.debug(`Hooking ${plugin.scopedName} plugin`)
          pluginsView.push({
            'name': androidPluginHook.name,
            'lcname': androidPluginHook.name.charAt(0).toLowerCase() +
            androidPluginHook.name.slice(1),
            'configurable': androidPluginHook.configurable
          })
        }
      }

      mustacheView.plugins = pluginsView

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
