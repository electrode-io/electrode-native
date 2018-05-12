import {
  PackagePath,
  mustacheUtils,
  shell,
  fileUtils,
  manifest,
  Platform,
  log,
  PluginConfig,
} from 'ern-core'
import fs from 'fs'
import path from 'path'
import readDir from 'fs-readdir-recursive'
import { ApiImplGeneratable } from '../../ApiImplGeneratable'

export const ROOT_DIR = shell.pwd()
const READ_EXECUTE = '555'
const READ_WRITE_EXECUTE = '777'
const SRC_MAIN_JAVA_DIR = path.join('src', 'main', 'java')
const API_IMPL_PACKAGE = path.join('com', 'ern', 'api', 'impl')

export default class ApiImplAndroidGenerator implements ApiImplGeneratable {
  public static getMustacheFileNamesMap(resourceDir, apiName) {
    const files = readDir(resourceDir, f => f.endsWith('.mustache'))
    const classNames = {
      'apiController.mustache': `${apiName}ApiController.java`,
      'requestHandlerProvider.mustache': `${apiName}ApiRequestHandlerProvider.java`,
      'requestHandlers.mustache': `${apiName}ApiRequestHandler.java`,
    }
    return { files, classNames }
  }

  public static createImplDirectoryAndCopyCommonClasses(paths) {
    const outputDir = path.join(
      paths.outDirectory,
      'android',
      'lib',
      SRC_MAIN_JAVA_DIR,
      API_IMPL_PACKAGE
    )
    if (!fs.existsSync(outputDir)) {
      shell.mkdir('-p', outputDir)
    }

    const resourceDir = path.join(
      Platform.currentPlatformVersionPath,
      'ern-api-impl-gen',
      'resources',
      'android'
    )
    shell.cp(path.join(resourceDir, 'RequestHandlerConfig.java'), outputDir)
    shell.cp(path.join(resourceDir, 'RequestHandlerProvider.java'), outputDir)
    return { outputDir, resourceDir }
  }

  private regenerateApiImpl: boolean

  get name(): string {
    return 'ApiImplAndroidGenerator'
  }

  get platform(): string {
    return 'android'
  }

  public async generate(
    apiDependency: PackagePath,
    paths: any,
    reactNativeVersion: string,
    plugins: PackagePath[],
    apis: any[],
    regen: boolean
  ) {
    log.debug(`Starting project generation for ${this.platform}`)
    this.regenerateApiImpl = regen
    await this.fillHull(apiDependency, paths, reactNativeVersion, plugins, apis)
  }

  public async fillHull(
    apiDependency: PackagePath,
    paths: any,
    reactNativeVersion: string,
    pluginsPaths: PackagePath[],
    apis: any[]
  ) {
    try {
      log.debug(
        `[=== Starting hull filling for api impl gen for ${this.platform} ===]`
      )

      shell.cd(ROOT_DIR)

      const outputDirectory = path.join(paths.outDirectory, 'android')
      log.debug(
        `Creating out directory(${outputDirectory}) for android and copying container hull to it.`
      )
      if (!fs.existsSync(outputDirectory)) {
        shell.mkdir(outputDirectory)
      }

      fileUtils.chmodr(READ_WRITE_EXECUTE, outputDirectory)
      shell.cp(
        '-Rf',
        path.join(paths.apiImplHull, 'android', '{.*,*}'),
        outputDirectory
      )

      const srcOutputDirectory = path.join(
        outputDirectory,
        'lib',
        SRC_MAIN_JAVA_DIR
      )
      let pluginPath: PackagePath
      for (pluginPath of pluginsPaths) {
        log.debug(`Copying ${pluginPath.basePath} to ${outputDirectory}`)
        await manifest.getPluginConfig(pluginPath).then(pluginConfig => {
          this.copyPluginToOutput(
            paths,
            srcOutputDirectory,
            pluginPath,
            pluginConfig
          )
        })
      }
      const editableFiles = await this.generateRequestHandlerClasses(
        apiDependency,
        paths,
        apis
      )
      await this.updateFilePermissions(srcOutputDirectory, editableFiles)

      await this.updateBuildGradle(paths, reactNativeVersion, outputDirectory)
    } catch (e) {
      throw new Error(`Error during apiimpl hull: ${e}`)
    }
  }

  public copyPluginToOutput(
    paths: any,
    pluginOutputDirectory: string,
    pluginPath: PackagePath,
    pluginConfig: PluginConfig
  ) {
    if (!pluginConfig.android) {
      throw new Error('Missing android plugin configuration')
    }
    log.debug(`injecting ${pluginPath.basePath} code.`)
    const pluginSrcDirectory = path.join(
      paths.pluginsDownloadDirectory,
      'node_modules',
      pluginPath.basePath,
      'android',
      pluginConfig.android.moduleName,
      SRC_MAIN_JAVA_DIR,
      '*'
    )
    if (!fs.existsSync(pluginOutputDirectory)) {
      shell.mkdir('-p', pluginOutputDirectory)
    }
    log.debug(
      `Copying code from ${pluginSrcDirectory} to ${pluginOutputDirectory}`
    )
    shell.cp('-Rf', pluginSrcDirectory, pluginOutputDirectory)
  }

  public async updateFilePermissions(
    srcOutputDirectory: string,
    editableFiles: string[]
  ) {
    log.debug('Updating file permissions')
    const files = shell
      .find(srcOutputDirectory)
      .filter(file => file.endsWith('.java'))
    for (const file of files) {
      editableFiles.includes(file)
        ? fileUtils.chmodr(READ_WRITE_EXECUTE, file)
        : fileUtils.chmodr(READ_EXECUTE, file)
    }
  }

  public updateBuildGradle(
    paths: any,
    reactNativeVersion: string,
    outputDirectory: string
  ): Promise<any> {
    const mustacheView: any = {}
    mustacheView.reactNativeVersion = reactNativeVersion
    return mustacheUtils.mustacheRenderToOutputFileUsingTemplateFile(
      path.join(paths.apiImplHull, 'android', 'lib', 'build.gradle'),
      mustacheView,
      path.join(outputDirectory, 'lib', 'build.gradle')
    )
  }

  public async generateRequestHandlerClasses(
    apiDependency: PackagePath,
    paths: any,
    apis: any[]
  ) {
    log.debug('=== updating request handler implementation class ===')
    try {
      const editableFiles: string[] = []
      const {
        outputDir,
        resourceDir,
      } = ApiImplAndroidGenerator.createImplDirectoryAndCopyCommonClasses(paths)

      for (const api of apis) {
        const {
          files,
          classNames,
        } = ApiImplAndroidGenerator.getMustacheFileNamesMap(
          resourceDir,
          api.apiName
        )
        for (const file of files) {
          if (!classNames[file]) {
            log.warn(
              `Skipping mustaching of ${file}. No resulting file mapping found, consider adding one. \nThis might cause issues in generated implementation project.`
            )
            throw new Error(
              `Class name mapping is missing for ${file}, unable to generate implementation class file.`
            )
          }

          if (file === 'requestHandlerProvider.mustache') {
            editableFiles.push(path.join(outputDir, classNames[file]))
            if (this.regenerateApiImpl) {
              log.debug(`Skipping regeneration of ${classNames[file]}`)
              continue
            }
          }
          await mustacheUtils.mustacheRenderToOutputFileUsingTemplateFile(
            path.join(resourceDir, file),
            api,
            path.join(outputDir, classNames[file])
          )
        }
        log.debug(
          `Api implementation files successfully generated for ${
            api.apiName
          }Api`
        )
      }
      return editableFiles
    } catch (e) {
      throw new Error(`Failed to update RequestHandlerClass: ${e}`)
    }
  }
}
