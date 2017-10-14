// @flow

import {
  Dependency,
  mustacheUtils,
  shell
} from 'ern-util'
import {
  manifest
} from 'ern-core'

import type { ApiImplGeneratable } from '../../ApiImplGeneratable'

type PluginConfig = {
  android: Object,
  ios: Object,
  origin?: Object,
  path?: string
}

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
    paths: {
      workingDirectory: string,
      pluginsDownloadDirectory: string,
      apiImplHull: string,
      outDirectory: string
    },
    reactNativeVersion: string,
    plugins: Array<Dependency>) {
    log.debug(`Starting project generation for ${this.platform}`)

    await this.fillHull(paths, reactNativeVersion, plugins)
  }

  async fillHull (paths: Object,
                  reactNativeVersion: string,
                  plugins: Array<Dependency>) {
    try {
      log.debug(`[=== Starting hull filling for api impl gen for ${this.platform} ===]`)

      shell.cd(`${ROOT_DIR}`)

      const outputDirectory = path.join(paths.outDirectory, `android`)
      log.debug(`Creating out directory(${outputDirectory}) for android and copying container hull to it.`)
      shell.mkdir(outputDirectory)

      shell.cp(`-R`, path.join(paths.apiImplHull, `/android/*`), outputDirectory)

      for (let plugin: Dependency of plugins) {
        log.debug(`Copying ${plugin.name} to ${outputDirectory}`)
        await manifest.getPluginConfig(plugin).then((pluginConfig) => {
          this.copyPluginToOutput(paths, outputDirectory, plugin, pluginConfig)
        })
      }

      this.updateBuildGradle(paths, reactNativeVersion, outputDirectory)
    } catch (e) {
      throw new Error(`Error during apiimpl hull: ${e}`)
    }
  }

  copyPluginToOutput (paths: Object, outputDirectory: string, plugin: Dependency, pluginConfig: PluginConfig) {
    log.debug(`injecting ${plugin.name} code.`)
    const pluginSrcDirectory = path.join(paths.pluginsDownloadDirectory, `node_modules`, plugin.scopedName, `android`, pluginConfig.android.moduleName, pluginConfig.android.moduleName === `lib` ? `src/main/java/*` : `src/main/java/`)
    log.debug(`Copying ${plugin.name} code from ${pluginSrcDirectory} to ${path.join(outputDirectory, `/lib/src/main/java`)}`)
    shell.cp(`-R`, pluginSrcDirectory, path.join(outputDirectory, `/lib/src/main/java/`))
  }

  updateBuildGradle (paths: Object, reactNativeVersion: string, outputDirectory: string): Promise<*> {
    let mustacheView = {}
    mustacheView.reactNativeVersion = reactNativeVersion
    return mustacheUtils.mustacheRenderToOutputFileUsingTemplateFile(
      path.join(paths.apiImplHull, `/android/lib/build.gradle`),
      mustacheView,
      path.join(outputDirectory, `/lib/build.gradle`))
  }
}
