// @flow

import {
  manifest,
  handleCopyDirective,
  ContainerGeneratorConfig,
  MavenUtils,
  GitUtils
} from 'ern-core'
import {
  mustacheUtils,
  Dependency,
  Utils
} from 'ern-util'
import {
  bundleMiniApps,
  downloadPluginSource,
  throwIfShellCommandFailed
} from '../../utils.js'
import _ from 'lodash'
import fs from 'fs'
import path from 'path'
import readDir from 'fs-readdir-recursive'
import shell from 'shelljs'

const ROOT_DIR = shell.pwd()
const DEFAULT_NAMESPACE = 'com.walmartlabs.ern'

export default class AndroidGenerator {
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
    miniapps: any,
    paths: any,
    mustacheView: any, {
      pathToYarnLock
    } : {
      pathToYarnLock?: string
    } = {}) {
    shell.cd(paths.outFolder)
    throwIfShellCommandFailed()

    const mavenPublisher = this._containerGeneratorConfig.firstAvailableMavenPublisher
    if (this._containerGeneratorConfig.shouldPublish()) {
      log.debug(`Container will be published to ${mavenPublisher.url}`)
      if (MavenUtils.isLocalMavenRepo(mavenPublisher.url)) {
        MavenUtils.createLocalMavenDirectoryIfDoesNotExist()
      }
    } else {
      log.warn('Something does not look right, android should always have a default maven publisher.')
      Utils.logErrorAndExitProcess(`Something does not look right, android should always have a default maven publisher. ${mavenPublisher}`)
    }

    const gitHubPublisher = this._containerGeneratorConfig.firstAvailableGitHubPublisher
    if (gitHubPublisher) {
      try {
        log.debug(`GitHub publisher found. Lets clone the repo before generating the container.`)
        let repoUrl = gitHubPublisher.url
        log.debug(`\n === Generated container will also be published to github
          targetRepoUrl: ${repoUrl}
          containerVersion: ${containerVersion}`)

        log.debug(`First lets clone the repo so we can update it with the newly generated container. Location: ${paths.outFolder}`)
        await GitUtils.gitClone(repoUrl, {destFolder: 'android'})

        shell.rm('-rf', `${paths.outFolder}/android/*`)
        throwIfShellCommandFailed()
      } catch (e) {
        Utils.logErrorAndExitProcess('Container generation Failed while cloning the repo. \n Check to see if the entered URL is correct')
      }
    }

    // Enhance mustache view with android specifics
    mustacheView.android = {
      repository: MavenUtils.targetRepositoryGradleStatement(mavenPublisher.url),
      namespace: this.namespace,
      hasMultipleMiniApps: miniapps.length > 1,
      miniapps: miniapps
    }

    //
    // Go through all ern-container-gen steps

    // Copy the container hull to output folder and patch it
    // - Retrieves (download) each plugin from npm or git and inject
    //   plugin source in container
    // - Inject configuration code for plugins that expose configuration
    // - Create activities for MiniApps
    // - Patch build.gradle for versioning of the container project and
    //   to specify publication repository target
    await this.fillContainerHull(plugins, miniapps, paths, mustacheView)

    // Bundle all the miniapps together and store resulting bundle in container project
    await bundleMiniApps(miniapps, paths, 'android', {pathToYarnLock})

    // Rnpm handling
    this.copyRnpmAssets(miniapps, paths)

    // Finally, container hull project is fully generated, now let's just
    // build it and publish resulting AAR
    await mavenPublisher.publish({workingDir: `${paths.outFolder}/android`, moduleName: `lib`})
    if (gitHubPublisher) {
      shell.cd(`${paths.outFolder}/android`)
      throwIfShellCommandFailed()
      await gitHubPublisher.publish({commitMessage: `Container v${containerVersion}`, tag: `v${containerVersion}`})
      log.info(`Code pushed to ${gitHubPublisher.url}`)
    }

    log.info(`Published com.walmartlabs.ern:${nativeAppName}-ern-container:${containerVersion}`)
    log.info(`To ${mavenPublisher.url}`)
  }

  async fillContainerHull (
    plugins: Array<Dependency>,
    miniApps: any,
    paths: any,
    mustacheView: any) : Promise<*> {
    try {
      log.debug(`[=== Starting container hull filling ===]`)

      log.debug(`> cd ${ROOT_DIR}`)
      shell.cd(`${ROOT_DIR}`)
      throwIfShellCommandFailed()

      const outputFolder = `${paths.outFolder}/android`

      log.debug(`> cp -R ${paths.containerHull}/android/* ${outputFolder}`)
      shell.cp('-R', `${paths.containerHull}/android/*`, outputFolder)
      shell.cp('-R', `${paths.containerHull}/android/.*`, outputFolder)
      throwIfShellCommandFailed()

      await this.buildAndroidPluginsViews(plugins, mustacheView)
      await this.addAndroidPluginHookClasses(plugins, paths)

      const reactNativeAarFileName = `react-native-${mustacheView.reactNativeVersion}.aar`
      log.debug(`> cp ${paths.reactNativeAars}/${reactNativeAarFileName} ${outputFolder}/lib/libs`)
      shell.cp(`${paths.reactNativeAars}/${reactNativeAarFileName}`, `${outputFolder}/lib/libs`)
      throwIfShellCommandFailed()

      for (const plugin of plugins) {
        if (plugin.name === 'react-native') { continue }
        let pluginConfig = await manifest.getPluginConfig(plugin)
        if (!pluginConfig.android) {
          log.warn(`Skipping ${plugin.name} as it does not have an Android configuration`)
          continue
        }
        log.debug(`> cd ${paths.pluginsDownloadFolder}`)
        shell.cd(`${paths.pluginsDownloadFolder}`)
        throwIfShellCommandFailed()
        let pluginSourcePath = await downloadPluginSource(pluginConfig.origin)
        if (!pluginSourcePath) {
          throw new Error(`Was not able to download ${plugin.name}`)
        }
        log.debug(`> cd ${pluginSourcePath}/${pluginConfig.android.root}`)
        shell.cd(`${pluginSourcePath}/${pluginConfig.android.root}`)
        throwIfShellCommandFailed()
        if (pluginConfig.android.moduleName) {
          log.debug(`> cp -R ${pluginConfig.android.moduleName}/src/main/java ${outputFolder}/lib/src/main`)
          shell.cp('-R', `${pluginConfig.android.moduleName}/src/main/java`, `${outputFolder}/lib/src/main`)
          throwIfShellCommandFailed()
        } else {
          log.debug(`> cp -R src/main/java ${outputFolder}/lib/src/main`)
          shell.cp('-R', `src/main/java`, `${outputFolder}/lib/src/main`)
          throwIfShellCommandFailed()
        }

        if (pluginConfig.android) {
          if (pluginConfig.android.copy) {
            handleCopyDirective(pluginSourcePath, outputFolder, pluginConfig.android.copy)
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
      const files = readDir(`${outputFolder}`, (f) => (!f.endsWith('.jar') && !f.endsWith('.aar') && !f.endsWith('.git')))
      for (const file of files) {
        if (file.startsWith(`lib/src/main/java/com`) && !file.startsWith(`lib/src/main/java/com/walmartlabs/ern/container`)) {
          // We don't want to Mustache process library files. It can lead to bad things
          // We just want to process container specific code (which contains mustache templates)
          log.debug(`Skipping mustaching of ${file}`)
          continue
        }
        log.debug(`Mustaching ${file}`)
        await mustacheUtils.mustacheRenderToOutputFileUsingTemplateFile(
            `${outputFolder}/${file}`, mustacheView, `${outputFolder}/${file}`)
      }

      // Create mini app activities
      log.debug(`Creating miniapp activities`)
      for (const miniApp of miniApps) {
        let tmpMiniAppView = {
          miniAppName: miniApp.unscopedName,
          pascalCaseMiniAppName: miniApp.pascalCaseName
        }

        let activityFileName = `${tmpMiniAppView.pascalCaseMiniAppName}Activity.java`

        log.debug(`Creating ${activityFileName}`)
        await mustacheUtils.mustacheRenderToOutputFileUsingTemplateFile(
            `${paths.containerTemplates}/android/MiniAppActivity.mustache`,
            tmpMiniAppView,
            `${outputFolder}/lib/src/main/java/com/walmartlabs/ern/container/miniapps/${activityFileName}`)
      }

      log.debug(`[=== Completed container hull filling ===]`)
    } catch (e) {
      log.error('[fillContainerHull] Something went wrong: ' + e)
      throw e
    }
  }

  copyRnpmAssets (
    miniApps: any,
    paths: any) {
    const outputFolder = path.join(paths.outFolder, 'android')
    // Case of local container for runner
    if ((miniApps.length === 1) && (miniApps[0].localPath)) {
      this.copyRnpmAssetsFromMiniAppPath(miniApps[0].localPath, outputFolder)
    } else {
      for (const miniApp of miniApps) {
        const miniAppPath = path.join(
          paths.compositeMiniApp,
          'node_modules',
          miniApp.scope ? `@${miniApp.scope}` : '',
          miniApp.name)
        this.copyRnpmAssetsFromMiniAppPath(miniAppPath, outputFolder)
      }
    }
  }

  copyRnpmAssetsFromMiniAppPath (miniAppPath: string, outputPath: string) {
    const packageJson = JSON.parse(fs.readFileSync(path.join(miniAppPath, 'package.json'), 'utf-8'))
    if (packageJson.rnpm && packageJson.rnpm.assets) {
      for (const assetDirectoryName of packageJson.rnpm.assets) {
        handleCopyDirective(miniAppPath, outputPath, [{ source: `${assetDirectoryName}/*`, dest: `lib/src/main/assets/${assetDirectoryName.toLowerCase()}` }])
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
          shell.cp(`${pluginConfig.path}/${androidPluginHook.name}.java`,
              `${paths.outFolder}/android/lib/src/main/java/com/walmartlabs/ern/container/plugins/`)
          throwIfShellCommandFailed()
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
        log.debug(`Will inject: compile 'com.facebook.react:react-native:${reactNativePlugin.version}'`)
        mustacheView.pluginCompile.push({
          'compileStatement': `compile ('com.facebook.react:react-native:${reactNativePlugin.version}@aar') { transitive=true }`
        })
      }
    } catch (e) {
      log.error('[buildAndroidPluginsViews] Something went wrong: ' + e)
      throw e
    }
  }
}
