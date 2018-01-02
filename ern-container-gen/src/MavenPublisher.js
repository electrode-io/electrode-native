// @flow
import type { Publisher } from './Publisher'
import {
  MavenUtils,
  shell,
  childProcess
 } from 'ern-core'
const {
  execp
} = childProcess

export default class MavenPublisher implements Publisher {
  _url: string
  _name: string = 'maven'

  constructor ({url = MavenUtils.getDefaultMavenLocalDirectory()}: { url: string } = {}) {
    this._url = url
  }

  get name (): string {
    return this._name
  }

  get url (): string {
    return this._url
  }

  async publish ({workingDir, moduleName}: { workingDir: string, moduleName: string } = {}): any {
    await this.buildAndPublishContainer(workingDir, moduleName)
  }

  async buildAndPublishContainer (workingDir: string, moduleName: string): Promise<*> {
    try {
      log.debug(`[=== Starting build and publication ===]`)
      shell.cd(workingDir)
      await this.buildAndUploadArchive(moduleName)
      log.debug(`[=== Completed build and publication of the module ===]`)
    } catch (e) {
      log.error('[buildAndPublishAndroidLib] Something went wrong: ' + e)
      throw e
    }
  }

  async buildAndUploadArchive (moduleName: string): Promise<*> {
    const gradlew = /^win/.test(process.platform) ? 'gradlew' : './gradlew'
    return execp(`${gradlew} ${moduleName}:uploadArchives`)
  }
}
