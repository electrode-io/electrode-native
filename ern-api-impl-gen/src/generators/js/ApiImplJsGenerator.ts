import { ApiImplGeneratable } from '../../ApiImplGeneratable'
import { log, mustacheUtils, PackagePath, Platform, shell } from 'ern-core'
import fs from 'fs-extra'
import path from 'path'

export default class ApiImplJsGenerator implements ApiImplGeneratable {
  private regenerateApiImpl: boolean

  get name(): string {
    return 'ApiImplJsGenerator'
  }

  get platform(): string {
    return 'js'
  }

  public async generate(
    apiDependency: PackagePath,
    paths: {
      apiImplHull: string
      outDirectory: string
    },
    reactNativeVersion: string,
    plugins: PackagePath[],
    apis: any[],
    regen: boolean
  ) {
    log.debug(`Starting project generation for ${this.platform}`)
    this.regenerateApiImpl = regen
    await this.fillHull(apiDependency, paths, apis)
  }

  public async fillHull(apiDependency: PackagePath, paths: any, apis: any[]) {
    shell.pushd(shell.pwd())
    try {
      const outputDirectory = path.join(paths.outDirectory, 'js')
      log.debug(`Creating out directory(${outputDirectory}) for JS.`)
      await fs.ensureDir(outputDirectory)
      const mustacheFile = path.join(
        Platform.currentPlatformVersionPath,
        'ern-api-impl-gen/resources/js/apiimpl.mustache'
      )

      for (const api of apis) {
        api.packageName = apiDependency.name
        await mustacheUtils.mustacheRenderToOutputFileUsingTemplateFile(
          mustacheFile,
          api,
          path.join(outputDirectory, `${api.apiName}ApiImpl.js`)
        )
      }

      const indexMustacheFile = path.join(
        Platform.currentPlatformVersionPath,
        'ern-api-impl-gen/resources/js/index.mustache'
      )
      const apisMustacheView = {
        apis,
      }
      await mustacheUtils.mustacheRenderToOutputFileUsingTemplateFile(
        indexMustacheFile,
        apisMustacheView,
        path.join(paths.outDirectory, 'index.js')
      )
    } finally {
      shell.popd()
    }
  }
}
