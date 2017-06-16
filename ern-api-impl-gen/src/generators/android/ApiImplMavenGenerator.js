import MavenGenerator from '../../../../ern-container-gen/src/generators/android/MavenGenerator'
import shell from 'shelljs'
import {
  Dependency, Utils
} from '@walmart/ern-util'

import {
  getPluginConfig,
  PluginConfig,
  mustacheRenderToOutputFileUsingTemplateFile
} from '../../../../ern-container-gen/src/utils.js'

import ApiImplGeneratable from '../../ApiImplGeneratable'

export const ROOT_DIR = shell.pwd()

export default class ApiImplMavenGenerator extends MavenGenerator implements ApiImplGeneratable {
  get name (): string {
    return 'ApiImplMavenGenerator'
  }

  async generate (api: string,
                  paths: Object,
                  plugins: Array<Dependency>) {
    log.debug(`Starting project generation for ${this.platform}`)

    await this.fillHull(api, paths, plugins)
  }

  async fillHull (api: string,
                  paths: Object,
                  plugins: Array<Dependency>) {
    try {
      log.debug(`[=== Starting hull filling for api impl gen for ${this.platform} ===]`)

      shell.cd(`${ROOT_DIR}`)
      Utils.throwIfShellCommandFailed()

      const outputFolder = `${paths.outFolder}/android/`
      log.debug(`Creating out folder(${outputFolder}) for android and copying container hull to it.`)
      shell.mkdir(outputFolder)
      Utils.throwIfShellCommandFailed()

      shell.cp(`-R`, `${paths.apiImplHull}/android/*`, outputFolder)
      Utils.throwIfShellCommandFailed()

      for (let plugin: Dependency of plugins) {
        await getPluginConfig(plugin, paths.pluginsConfigPath).then((pluginConfig) => {
          this.copyPluginToOutput(paths, outputFolder, plugin, pluginConfig)
        })
      }

      await this.copyReactNativeAarAndUpdateGradle(paths, outputFolder)
    } catch (e) {
      Utils.logErrorAndExitProcess(`Error while generating api impl hull for android: ${e}`)
    }
  }

  copyPluginToOutput (paths: Object, outputFolder: string, plugin: Dependency, pluginConfig: PluginConfig) {
    log.debug(`injecting ${plugin.name} code.`)
    const pluginSrcFolder = `${paths.pluginsDownloadFolder}/node_modules/${plugin.scopedName}/android/${pluginConfig.android.moduleName}/src/main/java/*`
    shell.cp(`-R`, pluginSrcFolder, `${outputFolder}/lib/src/main/java`)
  }

  copyReactNativeAarAndUpdateGradle (paths: Object, outputFolder: string): Promise {
    log.debug(`injecting react-native@${paths.reactNativeVersion} dependency`)
    let mustacheView = {}
    mustacheView.reactNativeVersion = paths.reactNativeVersion
    shell.cp(`${paths.reactNativeAarsPath}/react-native-${paths.reactNativeVersion}.aar`, `${outputFolder}/lib/libs/`)
    return mustacheRenderToOutputFileUsingTemplateFile(
      `${paths.apiImplHull}/android/lib/build.gradle`,
      mustacheView,
      `${outputFolder}/lib/build.gradle`)
  }
}
