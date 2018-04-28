import {
  iosUtil,
  Platform,
  PackagePath,
  shell,
  mustacheUtils,
  log,
} from 'ern-core'
import { ApiImplGeneratable } from '../../ApiImplGeneratable'
import fs from 'fs'
import path from 'path'
import xcode from 'xcode-ern'
import readDir from 'fs-readdir-recursive'

export const ROOT_DIR = shell.pwd()
const API_IMPL_GROUP_NAME = 'APIImpls'

export default class ApiImplIosGenerator implements ApiImplGeneratable {
  public static getMustacheFileNamesMap(resourceDir, apiName) {
    const files = readDir(resourceDir, f => f.endsWith('.mustache'))
    const classNames = {
      'apiController.mustache': `${apiName}ApiController.swift`,
      'requestHandlerDelegate.mustache': `${apiName}ApiRequestHandlerDelegate.swift`,
      'requestHandlerProvider.mustache': `${apiName}ApiRequestHandlerProvider.swift`,
    }
    return { files, classNames }
  }

  private regenerateApiImpl: boolean

  get name(): string {
    return 'ApiImplIosGenerator'
  }

  get platform(): string {
    return 'ios'
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
    await this.fillHull(paths, reactNativeVersion, plugins, apis)
  }

  public async fillHull(
    paths: any,
    reactNativeVersion: string,
    plugins: PackagePath[],
    apis: any[]
  ) {
    try {
      const pathSpec = {
        outputDir: path.join(paths.outDirectory, 'ios'),
        pluginsDownloadDirectory: paths.pluginsDownloadDirectory,
        projectHullDir: path.join(paths.apiImplHull, 'ios', '{.*,*}'),
        rootDir: ROOT_DIR,
      }

      const projectSpec = {
        projectName: 'ElectrodeApiImpl',
      }

      this.injectReactNativeToPlugins(reactNativeVersion, plugins)

      const { iosProject, projectPath } = await iosUtil.fillProjectHull(
        pathSpec,
        projectSpec,
        plugins
      )

      await this.generateRequestHandlerClasses(
        iosProject,
        pathSpec,
        projectSpec,
        apis
      )

      fs.writeFileSync(projectPath, iosProject.writeSync())

      log.debug('[=== Completed api-impl hull filling ===]')
    } catch (e) {
      log.error('Error while generating api impl hull for ios')
      throw e
    }
  }

  public injectReactNativeToPlugins(
    reactNativeVersion: string,
    plugins: PackagePath[]
  ) {
    const reactNativePlugin = new PackagePath(
      `react-native@${reactNativeVersion}`
    )

    log.debug(
      `Manually injecting react-native(${reactNativePlugin.toString()}) plugin to dependencies.`
    )
    plugins.push(reactNativePlugin)
  }

  public async getIosApiImplProject(apiImplProjectPath: string): Promise<any> {
    log.debug(apiImplProjectPath)

    const containerProject = xcode.project(apiImplProjectPath)

    return new Promise((resolve, reject) => {
      containerProject.parse(err => {
        if (err) {
          reject(err)
        }
        resolve(containerProject)
      })
    })
  }

  public async generateRequestHandlerClasses(
    iosProject: any,
    pathSpec: any,
    projectSpec: any,
    apis: any
  ) {
    log.debug('=== updating request handler implementation class ===')

    const {
      outputDir,
      resourceDir,
    } = this.createImplDirectoryAndCopyCommonClasses(
      pathSpec,
      projectSpec,
      iosProject
    )
    const editableFiles = []
    for (const api of apis) {
      const { files, classNames } = ApiImplIosGenerator.getMustacheFileNamesMap(
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
          const reqHandlerProviderClassFile = path.join(
            outputDir,
            classNames[file]
          )
          editableFiles.push(reqHandlerProviderClassFile)
          if (
            this.regenerateApiImpl &&
            shell.test('-e', reqHandlerProviderClassFile)
          ) {
            log.debug(`Skipping regeneration of ${classNames[file]}`)
            continue
          }
        }

        await mustacheUtils.mustacheRenderToOutputFileUsingTemplateFile(
          path.join(resourceDir, file),
          api,
          path.join(outputDir, classNames[file])
        )
        iosProject.addSourceFile(
          path.join(API_IMPL_GROUP_NAME, classNames[file]),
          null,
          iosProject.findPBXGroupKey({ name: API_IMPL_GROUP_NAME })
        )
      }

      log.debug(
        `Api implementation files successfully generated for ${api.apiName}Api`
      )
    }
  }

  public createImplDirectoryAndCopyCommonClasses(
    pathSpec: any,
    projectSpec: any,
    iosProject: any
  ) {
    const resourceDir = path.join(
      Platform.currentPlatformVersionPath,
      'ern-api-impl-gen',
      'resources',
      'ios'
    )
    const outputDir = path.join(
      pathSpec.outputDir,
      projectSpec.projectName,
      API_IMPL_GROUP_NAME
    )

    const requestHandlerConfigFile = 'RequestHandlerConfig.swift'
    const requestHandlerProviderFile = 'RequestHandlerProvider.swift'

    if (!shell.test('-e', outputDir)) {
      shell.mkdir(outputDir)
    }
    shell.cp(path.join(resourceDir, requestHandlerConfigFile), outputDir)
    shell.cp(path.join(resourceDir, requestHandlerProviderFile), outputDir)

    iosProject.addSourceFile(
      path.join(API_IMPL_GROUP_NAME, requestHandlerConfigFile),
      null,
      iosProject.findPBXGroupKey({ name: API_IMPL_GROUP_NAME })
    )
    iosProject.addSourceFile(
      path.join(API_IMPL_GROUP_NAME, requestHandlerProviderFile),
      null,
      iosProject.findPBXGroupKey({ name: API_IMPL_GROUP_NAME })
    )

    return { outputDir, resourceDir }
  }
}
