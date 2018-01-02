// @flow

import type { ApiImplGeneratable } from '../../ApiImplGeneratable'
import {
  Dependency,
  shell,
  mustacheUtils,
  Platform
} from 'ern-core'
import fs from 'fs'
import path from 'path'

export default class ApiImplJsGenerator implements ApiImplGeneratable {
  regenerateApiImpl: boolean

  get name (): string {
    return 'ApiImplJsGenerator'
  }

  get platform (): string {
    return 'js'
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
    await this.fillHull(apiDependency, paths, apis)
  }

  async fillHull (apiDependency: Dependency,
                  paths: Object,
                  apis: Array<Object>) {
    shell.cd(shell.pwd())
    const outputDirectory = path.join(paths.outDirectory, 'js')
    log.debug(`Creating out directory(${outputDirectory}) for JS.`)
    if (!fs.existsSync(outputDirectory)) {
      shell.mkdir(outputDirectory)
    }
    const mustacheFile = path.join(Platform.currentPlatformVersionPath, 'ern-api-impl-gen', 'resources', 'js', 'apiimpl.mustache')

    for (const api of apis) {
      api.packageName = apiDependency.scopedName
      await mustacheUtils.mustacheRenderToOutputFileUsingTemplateFile(
        mustacheFile,
        api,
        path.join(outputDirectory, `${api.apiName}ApiImpl.js`))
    }

    const indexMustacheFile = path.join(Platform.currentPlatformVersionPath, 'ern-api-impl-gen', 'resources', 'js', 'index.mustache')
    const apisMustacheView = {
      'apis': apis
    }
    await mustacheUtils.mustacheRenderToOutputFileUsingTemplateFile(
      indexMustacheFile,
      apisMustacheView,
      path.join(paths.outDirectory, 'index.js'))
  }
}
