// @flow

import * as schemas from './schemas'
import { Dependency } from '@walmart/ern-util'
import {
  alreadyExists,
  buildNativeBinaryFileName,
  buildReactNativeSourceMapFileName,
  checkNotFound,
  joiValidate,
  shasum
} from './util'
import _ from 'lodash'
import FileStore from './filestore'
import GitStore from './gitstore'

export default class CauldronApi {
  _db: GitStore
  _nativeBinariesStore: FileStore
  _sourceMapStore: FileStore

  constructor (
    db: GitStore,
    binaryStore: FileStore,
    sourcemapStore: FileStore) {
    this._db = db
    this._nativeBinariesStore = binaryStore
    this._sourceMapStore = sourcemapStore
  }

  async commit (message: string) {
    return this._db.commit(message)
  }

  async getCauldron () {
    return this._db.getCauldron()
  }

  // =====================================================================================
  // READ OPERATIONS
  // =====================================================================================

  async getNativeApplications () {
    const cauldron = await this.getCauldron()
    return cauldron.nativeApps
  }

  async getNativeApplication (name: string) {
    const cauldron = await this.getCauldron()
    return _.find(cauldron.nativeApps, n => n.name === name)
  }

  async getPlatforms (nativeApplicationName: string) {
    const app = await this.getNativeApplication(nativeApplicationName)
    return app == null ? null : app.platforms
  }

  async getPlatform (
    nativeApplicationName: string,
    platformName: string) {
    const platforms = await this.getPlatforms(nativeApplicationName)
    return _.find(platforms, p => p.name === platformName)
  }

  async getVersions (
    nativeApplicationName: string,
    platformName: string) {
    const platform = await this.getPlatform(nativeApplicationName, platformName)
    return platform.versions
  }

  async getVersion (
    nativeApplicationName: string,
    platformName: string,
    versionName: string) {
    const versions = await this.getVersions(nativeApplicationName, platformName)
    return _.find(versions, x => x.name === versionName)
  }

  async getOtaMiniApps (
    nativeApplicationName: string,
    platformName: string,
    versionName: string) {
    const {miniApps} = await this.getVersion(nativeApplicationName, platformName, versionName)
    return miniApps.ota
  }

  async getContainerMiniApps (
    nativeApplicationName: string,
    platformName: string,
    versionName: string) {
    const {miniApps} = await this.getVersion(nativeApplicationName, platformName, versionName)
    return miniApps.container
  }

  async getOtaMiniApp (
    nativeApplicationName: string,
    platformName: string,
    versionName: string,
    miniApp: any) {
    const miniApps = await this.getOtaMiniApps(nativeApplicationName, platformName, versionName)
    return _.find(miniApps, m => m.startsWith(miniApp.toString()))
  }

  async getContainerMiniApp (
    nativeApplicationName: string,
    platformName: string,
    versionName: string,
    miniApp: any) {
    const miniApps = await this.getContainerMiniApps(nativeApplicationName, platformName, versionName)
    return _.find(miniApps, m => m.startsWith(miniApp.toString()))
  }

  async getNativeDependencies (
    nativeApplicationName: string,
    platformName: string,
    versionName: string) {
    const {nativeDeps = []} = await this.getVersion(nativeApplicationName, platformName, versionName)
    return nativeDeps
  }

  async getNativeDependency (
    nativeApplicationName: string,
    platformName: string,
    versionName: string,
    nativedepName: string) {
    const nativeDeps = await this.getNativeDependencies(nativeApplicationName, platformName, versionName)
    return _.find(nativeDeps, x => x.startsWith(`${nativedepName}@`))
  }

  async getConfig ({
    appName,
    platformName,
    versionName
  } : {
    appName?: string,
    platformName?: string,
    versionName?: string
  } = {}) {
    if (appName) {
      if (platformName) {
        if (versionName) {
          const version = await this.getVersion(appName, platformName, versionName)
          return version.config
        }
        const platform = await this.getPlatform(appName, platformName)
        return platform.config
      }
      const app = await this.getNativeApplication(appName)
      return app.config
    }
  }

  // =====================================================================================
  // WRITE OPERATIONS
  // =====================================================================================

  async clearCauldron () {
    const cauldron = await this.getCauldron()
    cauldron.nativeApps = []
    await this.commit('Clear Cauldron')
  }

  async createNativeApplication (nativeApplication: any) {
    const cauldron = await this.getCauldron()
    if (!alreadyExists(cauldron.nativeApps, nativeApplication.name)) {
      const validatedNativeApplication = await joiValidate(nativeApplication, schemas.nativeApplication)
      cauldron.nativeApps.push(validatedNativeApplication)
      await this.commit(`Create ${nativeApplication.name} native application`)
    }
  }

  async removeNativeApplication (name: string) {
    const cauldron = await this.getCauldron()
    if (_.remove(cauldron.nativeApps, x => x.name === name).length > 0) {
      await this.commit(`Remove ${name} native application`)
    }
  }

  async createPlatform (
    nativeApplicationName: string,
    platform: any) {
    const nativeApplication = await this.getNativeApplication(nativeApplicationName)
    if (!alreadyExists(nativeApplication.platforms, platform.name)) {
      const validatedPlatform = await joiValidate(platform, schemas.nativeApplicationPlatform)
      nativeApplication.platforms.push(validatedPlatform)
      await this.commit(`Create ${platform.name} platform for ${nativeApplicationName}`)
    }
  }

  async removePlatform (
    nativeApplicationName: string,
    platformName: string) {
    const nativeApplication = await this.getNativeApplication(nativeApplicationName)
    if (_.remove(nativeApplication.platforms, x => x.name === platformName).length > 0) {
      await this.commit(`Remove ${platformName} platform from ${nativeApplicationName}`)
    }
  }

  async createVersion (
    nativeApplicationName: string,
    platformName: string,
    version: any) {
    const platform = await this.getPlatform(nativeApplicationName, platformName)
    if (!alreadyExists(platform.versions, version.name)) {
      const validatedVersion = await joiValidate(version, schemas.nativeApplicationVersion)
      platform.versions.push(validatedVersion)
      await this.commit(`Create version ${version.name} of ${nativeApplicationName} ${platformName}`)
    }
  }

  async removeVersion (
    nativeApplicationName: string,
    platformName: string,
    versionName: string) {
    const platform = await this.getPlatform(nativeApplicationName, platformName)
    checkNotFound(platform, `No platform named ${platformName}`)
    if (_.remove(platform.versions, x => x.name === versionName).length > 0) {
      await this.commit(`Remove version ${versionName} from ${nativeApplicationName} ${platformName}`)
    }
  }

  async updateVersion (
    nativeApplicationName: string,
    platformName: string,
    versionName: string,
    newVersion: string) {
    const validatedVersion = await joiValidate(newVersion, schemas.nativeAplicationVersionPatch)
    const version = await this.getVersion(nativeApplicationName, platformName, versionName)
    if (validatedVersion.isReleased != null) {
      version.isReleased = validatedVersion.isReleased
      await this.commit(`Update release status of ${nativeApplicationName} ${platformName} ${versionName}`)
    }
  }

  async removeNativeDependency (
    nativeApplicationName: string,
    platformName: string,
    versionName: string,
    dependency: string) {
    const version = await this.getVersion(nativeApplicationName, platformName, versionName)
    if (_.remove(version.nativeDeps, x => x.startsWith(`${dependency}@`)).length > 0) {
      await this.commit(`Remove ${dependency} dependency from ${nativeApplicationName} ${platformName}`)
    }
  }

  async updateNativeDependency (
    nativeApplicationName: string,
    platformName: string,
    versionName: string,
    dependencyName: string,
    newVersion: string) {
    const version = await this.getVersion(nativeApplicationName, platformName, versionName)
    _.remove(version.nativeDeps, x => x.startsWith(`${dependencyName}@`))
    const newDependencyString = `${dependencyName}@${newVersion}`
    version.nativeDeps.push(newDependencyString)
    await this.commit(`Update ${dependencyName} dependency to v${newVersion} for ${nativeApplicationName} ${platformName}`)
  }

  // Only version of miniapps in container can be updated
  async updateMiniAppVersion (
    nativeApplicationName: string,
    platformName: string,
    versionName: string,
    miniApp: any) {
    const version = await this.getVersion(nativeApplicationName, platformName, versionName)
    let miniAppInContainer = _.find(version.miniApps.container, m => Dependency.same(Dependency.fromString(m), miniApp, { ignoreVersion: true }))
    if (miniAppInContainer) {
      version.miniApps.container = _.map(version.miniApps.container, e => (e === miniAppInContainer) ? miniApp.toString() : e)
      await this.commit(`Update version of ${miniApp.name} MiniApp to ${miniApp.version}`)
    }
  }

  async removeOtaMiniApp (
    nativeApplicationName: string,
    platformName: string,
    versionName: string,
    miniAppName: string,
    miniAppVersion: string) {
    const version = await this.getVersion(nativeApplicationName, platformName, versionName)
    if (_.remove(version.miniApps.ota, x => x.name === `${miniAppName}@${miniAppVersion}`).length > 0) {
      await this.commit(`Remove ${miniAppName} from ${nativeApplicationName} ${platformName} ${versionName} ota`)
    }
  }

  async removeContainerMiniApp (
    nativeApplicationName: string,
    platformName: string,
    versionName: string,
    miniAppName: string) {
    const version = await this.getVersion(nativeApplicationName, platformName, versionName)
    if (_.remove(version.miniApps.container, x => x.name.startsWith(`${miniAppName}@`)).length > 0) {
      await this.commit(`Remove ${miniAppName} from ${nativeApplicationName} ${platformName} ${versionName} container`)
    }
  }

  async createNativeDependency (
    nativeApplicationName: string,
    platformName: string,
    versionName: string,
    dependency: any) {
    const version = await this.getVersion(nativeApplicationName, platformName, versionName)
    if (!version.nativeDeps.includes(dependency.toString())) {
      version.nativeDeps.push(dependency.toString())
      await this.commit(`Add native dependency ${dependency.name} to ${nativeApplicationName} ${platformName} ${versionName}`)
    }
  }

  async addOtaMiniApp (
    nativeApplicationName: string,
    platformName: string,
    versionName: string,
    miniapp: any) {
    const version = await this.getVersion(nativeApplicationName, platformName, versionName)
    if (!version.miniApps.ota.includes(miniapp.toString())) {
      version.miniApps.ota.push(miniapp.toString())
      await this.commit(`Add ${miniapp.name} MiniApp to ${nativeApplicationName} ${platformName} ${versionName} ota`)
    }
  }

  async addContainerMiniApp (
    nativeApplicationName: string,
    platformName: string,
    versionName: string,
    miniapp: any) {
    const version = await this.getVersion(nativeApplicationName, platformName, versionName)
    if (!version.miniApps.container.includes(miniapp.toString())) {
      version.miniApps.container.push(miniapp.toString())
      await this.commit(`Add ${miniapp.name} MiniApp to ${nativeApplicationName} ${platformName} ${versionName} container`)
    }
  }

  async validateAndGet (
    nativeApplicationName: string,
    platformName: string,
    versionName: string) {
    let app = await this.getNativeApplication(nativeApplicationName)
    let platform, version
    if (platformName) {
      platform = await this.getPlatform(nativeApplicationName, platformName)
      if (versionName) {
        version = await this.getVersion(nativeApplicationName, platformName, versionName)
      }
    }
    return {app, platform, version}
  }

  // =====================================================================================
  // FILE OPERATIONS (TO DEPRECATE OR IMPROVE)
  // =====================================================================================

  async getNativeBinary (
    nativeApplicationName: string,
    platformName: string,
    versionName: string) {
    const filename = buildNativeBinaryFileName(nativeApplicationName, platformName, versionName)
    return this._nativeBinariesStore.getFile(filename)
  }

  async removeNativeBinary (
    nativeApplicationName: string,
    platformName: string,
    versionName: string) {
    const version = await this.getVersion(nativeApplicationName, platformName, versionName)
    const filename = buildNativeBinaryFileName(nativeApplicationName, platformName, versionName)
    this._nativeBinariesStore.removeFile(filename)
    version.binary = null
    return this.commit(version)
  }

  async createSourceMap (
    nativeApplicationName: string,
    versionName: string,
    payload: any) {
    const filename = buildReactNativeSourceMapFileName(nativeApplicationName, versionName)
    this._sourceMapStore.storeFile(filename, payload)
    return true
  }

  async getSourceMap (
    nativeApplicationName: string,
    versionName: string) {
    const filename = buildReactNativeSourceMapFileName(nativeApplicationName, versionName)
    const fileExists = this._sourceMapStore.hasFile(filename)
    return fileExists ? this._sourceMapStore.getFile(filename) : false
  }

  async removeSourceMap (
    nativeApplicationName: string,
    versionName: string) {
    const filename = buildReactNativeSourceMapFileName(nativeApplicationName, versionName)
    const fileExists = this._sourceMapStore.hasFile(filename)
    return fileExists ? this._sourceMapStore.removeFile(filename) : false
  }

  async createNativeBinary (
    nativeApplicationName: string,
    platformName: string,
    versionName: string,
    payload: any) {
    const version = await this.getVersion(nativeApplicationName, platformName, versionName)

    const filename = buildNativeBinaryFileName(nativeApplicationName, platformName, versionName)

    await this._nativeBinariesStore.storeFile(filename, payload)

    version.binary = shasum(payload)
    this.commit(version)
    return version
  }
}
