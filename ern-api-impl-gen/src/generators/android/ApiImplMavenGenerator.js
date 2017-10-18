// @flow

import {
  Dependency,
  mustacheUtils,
  shell
} from 'ern-util'
import {
  manifest,
  Platform
} from 'ern-core'
import {
  ApiGenUtils
} from 'ern-api-gen'
import path from 'path'
import readDir from 'fs-readdir-recursive'

import type { ApiImplGeneratable } from '../../ApiImplGeneratable'

type PluginConfig = {
  android: Object,
  ios: Object,
  origin?: Object,
  path?: string
}

export const ROOT_DIR = shell.pwd()

export default class ApiImplMavenGenerator implements ApiImplGeneratable {
  get name (): string {
    return 'ApiImplMavenGenerator'
  }

  get platform (): string {
    return 'android'
  }

  async generate (apiDependency: Dependency,
                  paths: {
                    workingDirectory: string,
                    pluginsDownloadDirectory: string,
                    apiImplHull: string,
                    outDirectory: string
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

      shell.cd(ROOT_DIR)

      const outputDirectory = path.join(paths.outDirectory, `android`)
      log.debug(`Creating out directory(${outputDirectory}) for android and copying container hull to it.`)
      shell.mkdir(outputDirectory)

      shell.cp(`-R`, path.join(paths.apiImplHull, 'android', '*'), outputDirectory)

      for (let plugin: Dependency of plugins) {
        log.debug(`Copying ${plugin.name} to ${outputDirectory}`)
        await manifest.getPluginConfig(plugin).then((pluginConfig) => {
          this.copyPluginToOutput(paths, outputDirectory, plugin, pluginConfig)
        })
      }
      await this.generateRequestHandlerClasses(apiDependency, paths)

      this.updateBuildGradle(paths, reactNativeVersion, outputDirectory)
    } catch (e) {
      throw new Error(`Error during apiimpl hull: ${e}`)
    }
  }

  copyPluginToOutput (paths: Object, outputDirectory: string, plugin: Dependency, pluginConfig: PluginConfig) {
    log.debug(`injecting ${plugin.name} code.`)
    const pluginSrcDirectory = path.join(paths.pluginsDownloadDirectory, 'node_modules', plugin.scopedName, 'android', pluginConfig.android.moduleName,
      pluginConfig.android.moduleName === `lib` ? path.join('src', 'main', 'java', '*') : path.join('src', 'main', 'java'))
    log.debug(`Copying ${plugin.name} code from ${pluginSrcDirectory} to ${path.join(outputDirectory, 'lib', 'src', 'main', 'java')}`)
    shell.cp(`-R`, pluginSrcDirectory, path.join(outputDirectory, 'lib', 'src', 'main', 'java'))
  }

  updateBuildGradle (paths: Object, reactNativeVersion: string, outputDirectory: string): Promise<*> {
    let mustacheView = {}
    mustacheView.reactNativeVersion = reactNativeVersion
    return mustacheUtils.mustacheRenderToOutputFileUsingTemplateFile(
      path.join(paths.apiImplHull, 'android', 'lib', 'build.gradle'),
      mustacheView,
      path.join(outputDirectory, 'lib', 'build.gradle'))
  }

  async generateRequestHandlerClasses (apiDependency: Dependency, paths: Object) {
    log.debug(`=== updating request handler implementation class ===`)
    try {
      const schemaJson = path.join(paths.pluginsDownloadDirectory, `node_modules`, apiDependency.scopedName, `schema.json`)
      const {outputDir, resourceDir} = ApiImplMavenGenerator.createImplDirectoryAndCopyCommonClasses(paths)
      const apis = await ApiGenUtils.extractApiEventsAndRequests(schemaJson)

      for (const api of apis) {
        const {files, classNames} = ApiImplMavenGenerator.getMustacheFileNamesMap(resourceDir, api.apiName)
        for (const file of files) {
          if (!classNames[file]) {
            log.warn(`Skipping mustaching of ${file}. No resulting file mapping found, consider adding one. \nThis might cause issues in generated implemenation project.`)
            throw new Error(`Class name mapping is missing for ${file}, unable to generate implementation class file.`)
          }
          await mustacheUtils.mustacheRenderToOutputFileUsingTemplateFile(
            path.join(resourceDir, file),
            api,
            path.join(outputDir, classNames[file]))
        }
        log.debug(`Api implementation files successfully generated for ${api.apiName}Api`)
      }
    } catch (e) {
      throw new Error(`Failed to update RequestHandlerClass: ${e}`)
    }
  }

  static getMustacheFileNamesMap (resourceDir, apiName) {
    const files = readDir(resourceDir, (f) => (f.endsWith('.mustache')))
    const classNames = {
      'requestHandlers.mustache': `${apiName}ApiRequestHandler.java`,
      'requestHandlerProvider.mustache': `${apiName}ApiRequestHandlerProvider.java`,
      'apiController.mustache': `${apiName}ApiController.java`
    }
    return {files, classNames}
  }

  static createImplDirectoryAndCopyCommonClasses (paths) {
    const outputDir = path.join(paths.outDirectory, `/android/lib/src/main/java/com/ern/api/impl/`)
    shell.mkdir(`-p`, outputDir)

    const resourceDir = path.join(Platform.currentPlatformVersionPath, `ern-api-impl-gen/resources/android`)
    shell.cp(path.join(resourceDir, `RequestHandlerConfig.java`), outputDir)
    shell.cp(path.join(resourceDir, `RequestHandlerProvider.java`), outputDir)
    return {outputDir, resourceDir}
  }
}
