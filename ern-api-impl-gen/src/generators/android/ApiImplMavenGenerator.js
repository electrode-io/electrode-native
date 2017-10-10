// @flow

import shell from 'shelljs'
import {
  Dependency,
  Utils,
  mustacheUtils,
  fileUtils
} from 'ern-util'
import {
  manifest,
  utils
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
    apiDependency: Dependency,
    paths: {
      workingFolder: string,
      pluginsDownloadFolder: string,
      apiImplHull: string,
      outFolder: string
    },
    reactNativeVersion: string,
    plugins: Array<Dependency>) {
    log.debug(`Starting project generation for ${this.platform}`)

    await this.fillHull(apiDependency, paths, reactNativeVersion, plugins)
  }

  async fillHull (apiDependency: Dependency,
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
        log.debug(`Copying ${plugin.name} to ${outputFolder}`)
        await manifest.getPluginConfig(plugin).then((pluginConfig) => {
          this.copyPluginToOutput(paths, outputFolder, plugin, pluginConfig)
        })
      }
      await this.updateRequestHandlerClass(apiDependency, paths)

      this.updateBuildGradle(paths, reactNativeVersion, outputFolder)
    } catch (e) {
      throw new Error(`Error during apiimpl hull: ${e}`)
    }
  }

  copyPluginToOutput (paths: Object, outputFolder: string, plugin: Dependency, pluginConfig: PluginConfig) {
    log.debug(`injecting ${plugin.name} code.`)
    const pluginSrcFolder = path.join(paths.pluginsDownloadFolder, `node_modules`, plugin.scopedName, `android`, pluginConfig.android.moduleName, pluginConfig.android.moduleName === `lib` ? `src/main/java/*` : `src/main/java/`)
    log.debug(`Copying ${plugin.name} code from ${pluginSrcFolder} to ${path.join(outputFolder, `/lib/src/main/java`)}`)
    shell.cp(`-R`, pluginSrcFolder, path.join(outputFolder, `/lib/src/main/java/`))
  }

  updateBuildGradle (paths: Object, reactNativeVersion: string, outputFolder: string): Promise<*> {
    let mustacheView = {}
    mustacheView.reactNativeVersion = reactNativeVersion
    return mustacheUtils.mustacheRenderToOutputFileUsingTemplateFile(
      path.join(paths.apiImplHull, `/android/lib/build.gradle`),
      mustacheView,
      path.join(outputFolder, `/lib/build.gradle`))
  }

  async updateRequestHandlerClass (apiDependency: Dependency, paths: Object) {
    log.debug(`=== updating request handler implementation class ===`)
    let mustacheView = {}
    try {
      let jsonPath = path.join(paths.pluginsDownloadFolder, 'node_modules', apiDependency.scopedName, `package.json`)
      const packageJson = await fileUtils.readJSON(jsonPath)
      if (packageJson && packageJson.ern && packageJson.ern.message) {
        log.debug(`Generating RequestHandler implementation class`)
        mustacheView.apiName = utils.camelize(packageJson.ern.message.apiName)
        const outputDir = path.join(paths.outFolder, `/android/lib/src/main/java/com/ern/api/impl/`)
        shell.mkdir(`-p`, outputDir)
        shell.cp(path.join(paths.apiImplHull, `RequestHandlerProvider.java`), outputDir)

        return await mustacheUtils.mustacheRenderToOutputFileUsingTemplateFile(
          path.join(paths.apiImplHull, `requesthandlers.mustache`),
          mustacheView,
          path.join(outputDir, `${mustacheView.apiName}ApiRequestHandlers.java`))
      } else {
        log.warn(`package.json does not have an \`ern\` entry, implementation class will not be generated.`)
      }
    } catch (e) {
      throw new Error(`Failed to update RequestHandlerClass: ${e}`)
    }
  }
}
