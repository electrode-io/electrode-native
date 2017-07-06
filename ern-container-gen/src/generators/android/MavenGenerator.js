// @flow
import {
  Dependency
} from '@walmart/ern-util'
import {
  bundleMiniApps,
  downloadPluginSource,
  getPluginConfig,
  handleCopyDirective,
  mustacheRenderToOutputFileUsingTemplateFile,
  throwIfShellCommandFailed,
  spin
} from '../../utils.js'
import {
  exec
} from 'child_process'
import _ from 'lodash'
import fs from 'fs'
import http from 'http'
import readDir from 'fs-readdir-recursive'
import shell from 'shelljs'

const HOME_DIRECTORY = process.env['HOME']
const ROOT_DIR = shell.pwd()
const DEFAULT_NAMESPACE = 'com.walmartlabs.ern'
const FILE_REGEX = /^file:\/\//

const getDefaultMavenLocalDirectory = () => {
  if (!HOME_DIRECTORY) {
    throw new Error(`process.env['HOME'] is undefined !!!`)
  }
  return `file://${HOME_DIRECTORY}/.m2/repository`
}

export default class MavenGenerator {
  _mavenRepositoryUrl : string
  _namespace : string

  constructor ({
    mavenRepositoryUrl = getDefaultMavenLocalDirectory(),
    namespace = DEFAULT_NAMESPACE
   } : {
    mavenRepositoryUrl?: string,
    namespace?: string
   } = {}) {
    this._mavenRepositoryUrl = mavenRepositoryUrl
    this._namespace = namespace
  }

  get name () : string {
    return 'MavenGenerator'
  }

  get platform (): string {
    return 'android'
  }

  get mavenRepositoryUrl () : string {
    return this._mavenRepositoryUrl
  }

  get namespace () : string {
    return this._namespace
  }

  get mavenRepositoryType () : 'http' | 'file' | 'unknown' {
    if (this.mavenRepositoryUrl.startsWith('http')) {
      return 'http'
    } else if (this.mavenRepositoryUrl.startsWith('file')) {
      return 'file'
    }
    return 'unknown'
  }

  get targetRepositoryGradleStatement () : ?string {
    // Build repository statement to be injected in Android build.gradle for
    // publication target of generated container
    if (this.mavenRepositoryType === 'file') {
      return `repository(url: "${this.mavenRepositoryUrl}")`
    } else if (this.mavenRepositoryType === 'http') {
      return `repository(url: "${this.mavenRepositoryUrl}") { authentication(userName: mavenUser, password: mavenPassword) }`
    }
  }

  async generateContainer (
    containerVersion: string,
    nativeAppName: string,
    plugins: Array<Dependency>,
    miniapps: any,
    paths: any,
    mustacheView: any) {
    // If no maven repository url (for publication) is provided part of the generator config,
    // we just fall back to standard maven local repository location.
    // If folder does not exists yet, we create it
    const defaultMavenLocalDirectory = getDefaultMavenLocalDirectory()
    if ((this.mavenRepositoryUrl === defaultMavenLocalDirectory) &&
      (!fs.existsSync(defaultMavenLocalDirectory))) {
      shell.mkdir('-p', defaultMavenLocalDirectory.replace(FILE_REGEX, ''))
      throwIfShellCommandFailed()
    }

    // Enhance mustache view with android specifics
    mustacheView.android = {
      repository: this.targetRepositoryGradleStatement,
      namespace: this.namespace
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

    // Todo : move to utils .js as it is crossplatform
    // Bundle all the miniapps together and store resulting bundle in container
    // project
    await bundleMiniApps(miniapps, paths, 'android')

    // Finally, container hull project is fully generated, now let's just
    // build it and publish resulting AAR
    await this.buildAndPublishContainer(paths)

    log.info(`Published com.walmartlabs.ern:${nativeAppName}-ern-container:${containerVersion}`)
    log.info(`To ${this.mavenRepositoryUrl}`)
  }

  async fillContainerHull (
    plugins: Array<Dependency>,
    miniApps: any,
    paths: any,
    mustacheView: any) : Promise<*> {
    try {
      log.debug(`[=== Starting container hull filling ===]`)

      shell.cd(`${ROOT_DIR}`)
      throwIfShellCommandFailed()

      const outputFolder = `${paths.outFolder}/android`

      log.debug(`Creating out folder and copying Container Hull to it`)
      shell.cp('-R', `${paths.containerHull}/android/*`, outputFolder)
      throwIfShellCommandFailed()

      await this.buildAndroidPluginsViews(plugins, paths.pluginsConfigurationDirectory, mustacheView)
      await this.addAndroidPluginHookClasses(plugins, paths)

      const reactNativeAarFileName = `react-native-${mustacheView.reactNativeVersion}.aar`
      log.debug(`Injecting ${reactNativeAarFileName}`)
      shell.cp(`${paths.reactNativeAars}/${reactNativeAarFileName}`, `${outputFolder}/lib/libs`)
      throwIfShellCommandFailed()

      for (const plugin of plugins) {
        if (plugin.name === 'react-native') { continue }
        let pluginConfig = await getPluginConfig(plugin, paths.pluginsConfigurationDirectory)
        shell.cd(`${paths.pluginsDownloadFolder}`)
        throwIfShellCommandFailed()
        let pluginSourcePath = await spin(`Injecting ${plugin.name} code in container`,
            downloadPluginSource(pluginConfig.origin))
        if (!pluginSourcePath) {
          throw new Error(`Was not able to download ${plugin.name}`)
        }
        shell.cd(`${pluginSourcePath}/${pluginConfig.android.root}`)
        throwIfShellCommandFailed()
        if (pluginConfig.android.moduleName) {
          shell.cp('-R', `${pluginConfig.android.moduleName}/src/main/java`, `${outputFolder}/lib/src/main`)
          throwIfShellCommandFailed()
        } else {
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

        log.debug(`Patching hull`)
        const files = readDir(`${outputFolder}`, (f) => (!f.endsWith('.jar') && !f.endsWith('.aar')))
        for (const file of files) {
          await mustacheRenderToOutputFileUsingTemplateFile(
              `${outputFolder}/${file}`, mustacheView, `${outputFolder}/${file}`)
        }
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
        await mustacheRenderToOutputFileUsingTemplateFile(
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

  async addAndroidPluginHookClasses (
    plugins: Array<Dependency>,
    paths: any) : Promise<*> {
    try {
      log.debug(`[=== Adding plugin hook classes ===]`)

      for (const plugin of plugins) {
        if (plugin.name === 'react-native') { continue }
        let pluginConfig = await getPluginConfig(plugin, paths.pluginsConfigurationDirectory)
        let androidPluginHook = pluginConfig.android.pluginHook
        if (androidPluginHook) {
          console.log(`Adding ${androidPluginHook.name}.java`)
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
    pluginsConfigPath: string,
    mustacheView: any) : Promise<*> {
    try {
      let pluginsView = []

      for (const plugin of plugins) {
        if (plugin.name === 'react-native') {
          continue
        }
        let pluginConfig = await getPluginConfig(plugin, pluginsConfigPath)

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

  async buildAndPublishContainer (paths: any) : Promise<*> {
    try {
      log.debug(`[=== Starting build and publication of the container ===]`)

      shell.cd(`${paths.outFolder}/android`)
      throwIfShellCommandFailed()
      await spin(`Building container and publishing archive`,
          this.buildAndUploadArchive('lib'))

      log.debug(`[=== Completed build and publication of the container ===]`)
    } catch (e) {
      log.error('[buildAndPublishAndroidContainer] Something went wrong: ' + e)
      throw e
    }
  }

  async buildAndUploadArchive (moduleName: string) : Promise<*> {
    let cmd = `./gradlew ${moduleName}:uploadArchives `
    return new Promise((resolve, reject) => {
      exec(cmd,
        (err, stdout, stderr) => {
          if (err) {
            log.error(err)
            reject(err)
          }
          if (stderr) {
            log.error(stderr)
          }
          if (stdout) {
            log.debug(stdout)
            resolve(stdout)
          }
        })
    })
  }

  // Not used for now, but kept here. Might need it
  async isArtifactInMavenRepo (artifactDescriptor: string, mavenRepoUrl: string) : Promise<?boolean> {
    // An artifact follows the format group:name:version
    // i.e com.walmartlabs.ern:react-native-electrode-bridge:1.0.0
    // Split it !
    const explodedArtifactDescriptor = artifactDescriptor.split(':')
    // We replace all '.' in the group with `/`
    // i.e: com.walmartlabs.ern => com/walmartlabs/ern
    // As it corresponds to the path where artifact is stored
    explodedArtifactDescriptor[0] = explodedArtifactDescriptor[0].replace(/[.]/g, '/')
    // And we join everything together to get full path in the repository
    // i.e: com.walmartlabs.ern:react-native-electrode-bridge:1.0.0
    // => com/walmartlabs/ern/react-native-electrode-bridge/1.0.0
    const pathToArtifactInRepository = explodedArtifactDescriptor.join('/')

    // Remote maven repo
    // Just do an HTTP GET to the url of the artifact.
    // If it returns '200' status code, it means the artifact exists, otherwise
    // it doesn't
    if (this.mavenRepositoryType === 'http') {
      // Last `/` is important here, otherwise we'll get an HTTP 302 instead of 200
      // in case the artifact does exists !
      const res = await this.httpGet(`${mavenRepoUrl}/${pathToArtifactInRepository}/`)
      return res.statusCode === 200
    } else if (this.mavenRepositoryType === 'file') {
      const mavenRepositoryPath = mavenRepoUrl.replace('file://', '')
      return fs.existsSync(`${mavenRepositoryPath}/${pathToArtifactInRepository}`)
    }
  }

  async httpGet (url: string) : Promise<http.IncomingMessage> {
    return new Promise((resolve, reject) => {
      http.get(url, res => {
        resolve(res)
      }).on('error', e => {
        reject(e)
      })
    })
  }
}
