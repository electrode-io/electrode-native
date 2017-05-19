import _ from 'lodash'
import child_process from 'child_process'
import fs from 'fs'
import http from 'http'
import readDir from 'fs-readdir-recursive'
import shell from 'shelljs'

import { 
  getPluginConfig,
  bundleMiniApps,
  spin,
  downloadPluginSource,
  handleCopyDirective,
  mustacheRenderToOutputFileUsingTemplateFile,
  capitalizeFirstLetter,
  throwIfShellCommandFailed
} from '../../utils.js'

const DEFAULT_MAVEN_REPO_URL = `file://${process.env['HOME']}/.m2/repository`
const DEFAULT_NAMESPACE = 'com.walmartlabs.ern'
const fileRe = /^file:\/\//
const ROOT_DIR = shell.pwd()
const exec = child_process.exec

export default class MavenGenerator {
  constructor({ 
    mavenRepositoryUrl = DEFAULT_MAVEN_REPO_URL,
    namespace = DEFAULT_NAMESPACE
   } = {}) {
    this._mavenRepositoryUrl = mavenRepositoryUrl
    this._namespace = namespace
  }

  get name() { 
    return "MavenGenerator"
  }
  
  get platform() {
    return "android"
  }

  get mavenRepositoryUrl() {
    return this._mavenRepositoryUrl
  }

  get namespace() {
    return this._namespace
  }

  get mavenRepositoryType() {
    if (this.mavenRepositoryUrl.startsWith('http')) {
      return 'http'
    } else if (this.mavenRepositoryUrl.startsWith('file')) {
      return 'file'
    }
    return 'unknown'
  }

  get targetRepositoryGradleStatement() {
    // Build repository statement to be injected in Android build.gradle for
    // publication target of generated container
    let gradleMavenRepositoryCode
    if (this.mavenRepositoryType === 'file') {
      return `repository(url: "${this.mavenRepositoryUrl}")`
    } else if (this.mavenRepositoryType === 'http') {
      return `repository(url: "${this.mavenRepositoryUrl}") { authentication(userName: mavenUser, password: mavenPassword) }`
    }
  }

  async generateContainer(
    containerVersion,
    nativeAppName,
    platformPath,
    plugins,
    miniapps,
    paths,
    mustacheView) {
    // If no maven repository url (for publication) is provided part of the generator config,
    // we just fall back to standard maven local repository location.
    // If folder does not exists yet, we create it
    if ((this.mavenRepositoryUrl === DEFAULT_MAVEN_REPO_URL)
      && (!fs.existsSync(DEFAULT_MAVEN_REPO_URL))) {
      shell.mkdir('-p', DEFAULT_MAVEN_REPO_URL.replace(fileRe, ''))
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

    console.log(`Published com.walmartlabs.ern:${nativeAppName}-ern-container:${containerVersion}`)
    console.log(`To ${this.mavenRepositoryUrl}`)

  }

  async fillContainerHull(plugins, miniApps, paths, mustacheView) {
    try {
      console.log(`[=== Starting container hull filling ===]`)

      shell.cd(`${ROOT_DIR}`)
      throwIfShellCommandFailed()

      const outputFolder =`${paths.outFolder}/android`

      console.log(`Creating out folder and copying Container Hull to it`)
      shell.cp('-R', `${paths.containerHull}/android/*`, outputFolder)
      throwIfShellCommandFailed()

      await this.buildAndroidPluginsViews(plugins, paths.containerPluginsConfig, mustacheView)
      await this.addAndroidPluginHookClasses(plugins, paths)

      console.log(`Patching hull`)
      const files = readDir(`${outputFolder}`, (f) => (!f.endsWith('.jar') && !f.endsWith('.aar')))
      for (const file of files) {
        await mustacheRenderToOutputFileUsingTemplateFile(
            `${outputFolder}/${file}`, mustacheView, `${outputFolder}/${file}`)
      }

      for (const plugin of plugins) {
        if (plugin.name === 'react-native') { continue; }
        let pluginConfig = await getPluginConfig(plugin, paths.containerPluginsConfig)
        shell.cd(`${paths.pluginsDownloadFolder}`)
        throwIfShellCommandFailed()
        let pluginSourcePath = await spin(`Injecting ${plugin.name} code in container`,
            downloadPluginSource(pluginConfig.origin))
        shell.cd(`${pluginSourcePath}/${pluginConfig.android.root}`)
        throwIfShellCommandFailed()
        if (pluginConfig.android.moduleName) {
              shell.cp('-R', `${pluginConfig.android.moduleName}/src/main/java`, `${outputFolder}/lib/src/main`)
              throwIfShellCommandFailed()
        } else {
          shell.cp('-R', `src/main/java`, `${outputFolder}/lib/src/main`)
          throwIfShellCommandFailed()
        }

        if (pluginConfig.android && pluginConfig.android.copy) {
          handleCopyDirective(pluginSourcePath, outputFolder, pluginConfig.android.copy)
        }
      }

      // Create mini app activities
      console.log(`Creating miniapp activities`)
      for (const miniApp of miniApps) {
        let tmpMiniAppView = {
          miniAppName: miniApp.unscopedName,
          pascalCaseMiniAppName: miniApp.pascalCaseName
        }

        let activityFileName = `${tmpMiniAppView.pascalCaseMiniAppName}Activity.java`

        console.log(`Creating ${activityFileName}`)
        await mustacheRenderToOutputFileUsingTemplateFile(
            `${paths.containerTemplates}/android/MiniAppActivity.mustache`,
            tmpMiniAppView,
            `${outputFolder}/lib/src/main/java/com/walmartlabs/ern/container/miniapps/${activityFileName}`)
      }

      console.log(`[=== Completed container hull filling ===]`)
    } catch (e) {
        console.log("[fillContainerHull] Something went wrong: " + e)
        throw e
    }
  }

  async addAndroidPluginHookClasses(plugins, paths) {
    try {
      console.log(`[=== Adding plugin hook classes ===]`)

      for (const plugin of plugins) {
        if (plugin.name === 'react-native') { continue; }
        let pluginConfig = await getPluginConfig(plugin, paths.containerPluginsConfig)
        let androidPluginHook = pluginConfig.android.pluginHook
        if (androidPluginHook) {
          console.log(`Adding ${androidPluginHook.name}.java`)
          shell.cp(`${paths.containerPluginsConfig}/${plugin.name}/${androidPluginHook.name}.java`,
              `${paths.outFolder}/android/lib/src/main/java/com/walmartlabs/ern/container/plugins/`)
          throwIfShellCommandFailed()
        }
      }

      console.log(`[=== Done adding plugin hook classes ===]`)
    } catch (e) {
      console.log("[addAndroidPluginHookClasses] Something went wrong: " + e)
      throw e
    }
  }

  async buildAndroidPluginsViews(plugins, pluginsConfigPath, mustacheView) {
    try {
      let pluginsView = []

      for (const plugin of plugins) {
        if (plugin.name === 'react-native') {
          continue
        }
        let pluginConfig = await getPluginConfig(plugin, pluginsConfigPath)

        let androidPluginHook = pluginConfig.android.pluginHook
        if (androidPluginHook) {
          console.log(`Hooking ${plugin.name} plugin`)
          pluginsView.push({
            "name": androidPluginHook.name,
            "lcname": androidPluginHook.name.charAt(0).toLowerCase() +
            androidPluginHook.name.slice(1),
            "configurable": androidPluginHook.configurable
          })
        }
      }

      mustacheView.plugins = pluginsView

      mustacheView.pluginCompile = []
      const reactNativePlugin = _.find(plugins, p => p.name === 'react-native')
      if (reactNativePlugin) {
        console.log(`Will inject: compile 'com.facebook.react:react-native:${reactNativePlugin.version}'`)
        mustacheView.pluginCompile.push({
            "compileStatement": `compile ('com.facebook.react:react-native:${reactNativePlugin.version}@aar') { transitive=true }`
        })
      }
    } catch (e) {
      console.log("[buildAndroidPluginsViews] Something went wrong: " + e)
      throw e
    }
  }

  async buildAndPublishContainer(paths) {
    try {
      console.log(`[=== Starting build and publication of the container ===]`)

      shell.cd(`${paths.outFolder}/android`)
      throwIfShellCommandFailed()
      await spin(`Building container and publishing archive`,
          this.buildAndUploadArchive('lib'))

      console.log(`[=== Completed build and publication of the container ===]`)
    } catch (e) {
      console.log("[buildAndPublishAndroidContainer] Something went wrong: " + e)
      throw e
    }
  }


  async buildAndUploadArchive(moduleName) {
    let cmd = `./gradlew ${moduleName}:uploadArchives `
    return new Promise((resolve, reject) => {
      exec(cmd,
        (err, stdout, stderr) => {
          if (err) {
            console.log(err)
            reject(err)
          }
          if (stderr) {
            console.log(stderr)
          }
          if (stdout) {
            console.log(stdout)
            resolve(stdout)
          }
        })
    })
  }

  // Not used for now, but kept here. Might need it
  async isArtifactInMavenRepo(artifactDescriptor, mavenRepoUrl) {
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
      const res = await httpGet(`${mavenRepoUrl}/${pathToArtifactInRepository}/`)
      return res.statusCode === 200
    }
    // Otherwise if local storage just check if folder exists !
    else if (this.mavenRepositoryType === 'file') {
      const mavenRepositoryPath = mavenRepoUrl.replace('file://', '')
      const exists = fs.existsSync(`${mavenRepositoryPath}/${pathToArtifactInRepository}`)
      return fs.existsSync(`${mavenRepositoryPath}/${pathToArtifactInRepository}`)
    }
  }

  async httpGet(url) {
    return new Promise((resolve, reject) => {
      http.get(url, res => {
        resolve(res)
      }).on('error', e => {
        reject(e)
      })
    })
  }
}