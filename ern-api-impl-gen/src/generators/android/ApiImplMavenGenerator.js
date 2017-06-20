// @flow

import shell from 'shelljs'
import {
  Dependency, Utils
} from '@walmart/ern-util'

import {
  getPluginConfig,
  mustacheRenderToOutputFileUsingTemplateFile
} from '../../../../ern-container-gen/src/utils.js'

import type { PluginConfig } from '../../../../ern-container-gen/src/utils.js'

import type { ApiImplGeneratable } from '../../ApiImplGeneratable'

const path = require('path')

export const ROOT_DIR = shell.pwd()

export default class ApiImplMavenGenerator implements ApiImplGeneratable {
  get name (): string {
    return 'ApiImplMavenGenerator'
  }

  get platform (): string {
    return 'android'
  }

  async generate (
    api: string,
    paths: {
      workingFolder: string,
      pluginsDownloadFolder: string,
      pluginsConfigPath: string,
      apiImplHull: string,
      reactNativeAarsPath: string,
      outFolder: string
    },
    reactNativeVersion: string,
    plugins: Array<Dependency>) {
    log.debug(`Starting project generation for ${this.platform}`)

    await this.fillHull(api, paths, reactNativeVersion, plugins)
  }

  async fillHull (api: string,
                  paths: Object,
                  reactNativeVersion: string,
                  plugins: Array<Dependency>) {
    try {
      log.debug(`[=== Starting hull filling for api impl gen for ${this.platform} ===]`)

      shell.cd(`${ROOT_DIR}`)
      Utils.throwIfShellCommandFailed()

      const outputFolder = path.join(paths.outFolder, `android`)
      log.debug(`Creating out folder(${outputFolder}) for android and copying container hull to it.`)
      shell.mkdir(outputFolder)
      Utils.throwIfShellCommandFailed()

      shell.cp(`-R`, path.join(paths.apiImplHull, `/android/*`), outputFolder)
      Utils.throwIfShellCommandFailed()

      for (let plugin: Dependency of plugins) {
        await getPluginConfig(plugin, paths.pluginsConfigPath).then((pluginConfig) => {
          this.copyPluginToOutput(paths, outputFolder, plugin, pluginConfig)
        })
      }

      await this.copyReactNativeAarAndUpdateGradle(paths, reactNativeVersion, outputFolder)
    } catch (e) {
      Utils.logErrorAndExitProcess(`Error while generating api impl hull for android: ${e}`)
    }
  }

  copyPluginToOutput (paths: Object, outputFolder: string, plugin: Dependency, pluginConfig: PluginConfig) {
    log.debug(`injecting ${plugin.name} code.`)
    const pluginSrcFolder = path.join(paths.pluginsDownloadFolder, `node_modules`, plugin.scopedName, `android`, pluginConfig.android.moduleName, `src/main/java/*`)
    shell.cp(`-R`, pluginSrcFolder, path.join(outputFolder, `/lib/src/main/java`))
  }

  copyReactNativeAarAndUpdateGradle (paths: Object, reactNativeVersion: string, outputFolder: string): Promise<*> {
    log.debug(`injecting react-native@${paths.reactNativeVersion} dependency`)
    let mustacheView = {}
    mustacheView.reactNativeVersion = reactNativeVersion
    shell.cp(path.join(paths.reactNativeAarsPath, `/react-native-${reactNativeVersion}.aar`), path.join(outputFolder, `/lib/libs/`))
    return mustacheRenderToOutputFileUsingTemplateFile(
      path.join(paths.apiImplHull, `/android/lib/build.gradle`),
      mustacheView,
      path.join(outputFolder, `/lib/build.gradle`))
  }
}
