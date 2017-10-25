// @flow

import {
  Dependency,
  mustacheUtils,
  shell,
  fileUtils
} from 'ern-util'
import {
  manifest,
  Platform
} from 'ern-core'
import fs from 'fs'
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
const READ_EXECUTE = '555'
const READ_WRITE_EXECUTE = '777'
export default class ApiImplMavenGenerator implements ApiImplGeneratable {
  regenerateApiImpl:boolean
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
                  plugins: Array<Dependency>,
                  apis: Array<Object>,
                  regen: boolean) {
    log.debug(`Starting project generation for ${this.platform}`)
    this.regenerateApiImpl = regen
    await this.fillHull(apiDependency, paths, reactNativeVersion, plugins, apis)
  }

  async fillHull (apiDependency: Dependency,
                  paths: Object,
                  reactNativeVersion: string,
                  plugins: Array<Dependency>,
                  apis: Array<Object>) {
    try {
      log.debug(`[=== Starting hull filling for api impl gen for ${this.platform} ===]`)

      shell.cd(ROOT_DIR)

      const outputDirectory = path.join(paths.outDirectory, 'android')
      log.debug(`Creating out directory(${outputDirectory}) for android and copying container hull to it.`)
      if (!fs.existsSync(outputDirectory)) {
        shell.mkdir(outputDirectory)
      }

      fileUtils.chmodr(READ_WRITE_EXECUTE, outputDirectory)
      shell.cp(`-Rf`, path.join(paths.apiImplHull, 'android', '*'), outputDirectory)

      const pluginOutputDirectory = path.join(outputDirectory, 'lib', 'src', 'main', 'java')
      for (let plugin: Dependency of plugins) {
        log.debug(`Copying ${plugin.name} to ${outputDirectory}`)
        await manifest.getPluginConfig(plugin).then((pluginConfig) => {
          this.copyPluginToOutput(paths, pluginOutputDirectory, plugin, pluginConfig)
        })
      }
      const editableFiles = await this.generateRequestHandlerClasses(apiDependency, paths, apis)
      await this.updateFilePermissions(pluginOutputDirectory, editableFiles)

      await this.updateBuildGradle(paths, reactNativeVersion, outputDirectory)
    } catch (e) {
      throw new Error(`Error during apiimpl hull: ${e}`)
    }
  }

  copyPluginToOutput (paths: Object, pluginOutputDirectory: string, plugin: Dependency, pluginConfig: PluginConfig) {
    log.debug(`injecting ${plugin.name} code.`)
    const pluginSrcDirectory = path.join(paths.pluginsDownloadDirectory, 'node_modules', plugin.scopedName, 'android', pluginConfig.android.moduleName, 'src', 'main', 'java', '*')
    if (!fs.existsSync(pluginOutputDirectory)) {
      shell.mkdir('-p', pluginOutputDirectory)
    }
    log.debug(`Copying code from ${pluginSrcDirectory} to ${pluginOutputDirectory}`)
    shell.cp(`-Rf`, pluginSrcDirectory, pluginOutputDirectory)
  }

  async updateFilePermissions (pluginOutputDirectory: string, editableFiles: Array<string>) {
    log.debug('Updating file permissions')
    fileUtils.chmodr(READ_EXECUTE, pluginOutputDirectory)
    for (const editableFile of editableFiles) {
      fileUtils.chmodr(READ_WRITE_EXECUTE, editableFile)
    }
  }

  updateBuildGradle (paths: Object, reactNativeVersion: string, outputDirectory: string): Promise<*> {
    let mustacheView = {}
    mustacheView.reactNativeVersion = reactNativeVersion
    return mustacheUtils.mustacheRenderToOutputFileUsingTemplateFile(
      path.join(paths.apiImplHull, 'android', 'lib', 'build.gradle'),
      mustacheView,
      path.join(outputDirectory, 'lib', 'build.gradle'))
  }

  async generateRequestHandlerClasses (apiDependency: Dependency, paths: Object, apis: Array<Object>) {
    log.debug(`=== updating request handler implementation class ===`)
    try {
      let editableFiles = []
      const {outputDir, resourceDir} = ApiImplMavenGenerator.createImplDirectoryAndCopyCommonClasses(paths)

      for (const api of apis) {
        const {files, classNames} = ApiImplMavenGenerator.getMustacheFileNamesMap(resourceDir, api.apiName)
        for (const file of files) {
          if (!classNames[file]) {
            log.warn(`Skipping mustaching of ${file}. No resulting file mapping found, consider adding one. \nThis might cause issues in generated implementation project.`)
            throw new Error(`Class name mapping is missing for ${file}, unable to generate implementation class file.`)
          }

          if (file === `requestHandlerProvider.mustache`) {
            editableFiles.push(path.join(outputDir, classNames[file]))
            if (this.regenerateApiImpl) {
              log.debug(`Skipping regeneration of ${classNames[file]}`)
              continue
            }
          }
          await mustacheUtils.mustacheRenderToOutputFileUsingTemplateFile(
            path.join(resourceDir, file),
            api,
            path.join(outputDir, classNames[file]))
        }
        log.debug(`Api implementation files successfully generated for ${api.apiName}Api`)
      }
      return editableFiles
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
    if (!fs.existsSync(outputDir)) {
      shell.mkdir(`-p`, outputDir)
    }

    const resourceDir = path.join(Platform.currentPlatformVersionPath, `ern-api-impl-gen/resources/android`)
    shell.cp(path.join(resourceDir, `RequestHandlerConfig.java`), outputDir)
    shell.cp(path.join(resourceDir, `RequestHandlerProvider.java`), outputDir)
    return {outputDir, resourceDir}
  }
}
