// @flow

import * as schemas from './schemas'
import { Dependency } from 'ern-util'
import {
  alreadyExists,
  buildReactNativeSourceMapFileName,
  joiValidate,
  shasum
} from './util'
import _ from 'lodash'
import FileStore from './filestore'
import GitStore from './gitstore'

import type {
  CauldronCodePushEntry
} from './gitstore'

export default class CauldronApi {
  _db: GitStore
  _sourceMapStore: FileStore
  _yarnlockStore: FileStore

  constructor (
    db: GitStore,
    sourcemapStore: FileStore,
    yarnlockStore: FileStore) {
    this._db = db
    this._sourceMapStore = sourcemapStore
    this._yarnlockStore = yarnlockStore
  }

  async commit (message: string) {
    return this._db.commit(message)
  }

  async getCauldron () {
    return this._db.getCauldron()
  }

  // =====================================================================================
  // TRANSACTION MANAGEMENT
  // =====================================================================================

  async beginTransaction () {
    await this._db.beginTransaction()
    await this._yarnlockStore.beginTransaction()
  }

  async discardTransaction () {
    await this._db.discardTransaction()
    await this._yarnlockStore.discardTransaction()
  }

  async commitTransaction (message: string | Array<string>) {
    await this._db.commitTransaction(message)
    await this._yarnlockStore.commitTransaction(message)
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
    if (app) {
      return app.platforms
    }
  }

  async getPlatform (
    nativeApplicationName: string,
    platformName: string) {
    const platforms = await this.getPlatforms(nativeApplicationName)
    if (platforms) {
      return _.find(platforms, p => p.name === platformName)
    }
  }

  async getVersions (
    nativeApplicationName: string,
    platformName: string) {
    const platform = await this.getPlatform(nativeApplicationName, platformName)
    if (platform) {
      return platform.versions
    }
  }

  async getVersion (
    nativeApplicationName: string,
    platformName: string,
    versionName: string) {
    const versions = await this.getVersions(nativeApplicationName, platformName)
    if (versions) {
      return _.find(versions, x => x.name === versionName)
    }
  }

  async getCodePushEntries (
    nativeApplicationName: string,
    platformName: string,
    versionName: string,
    deploymentName: string) {
    const version = await this.getVersion(nativeApplicationName, platformName, versionName)
    return version && version.codePush && version.codePush[deploymentName]
  }

  async getContainerMiniApps (
    nativeApplicationName: string,
    platformName: string,
    versionName: string) {
    const version = await this.getVersion(nativeApplicationName, platformName, versionName)
    if (version && version.miniApps) {
      return version.miniApps.container
    }
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
    const version = await this.getVersion(nativeApplicationName, platformName, versionName)
    return version == null ? [] : version.nativeDeps
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
          return version == null ? undefined : version.config
        }
        const platform = await this.getPlatform(appName, platformName)
        return platform == null ? undefined : platform.config
      }
      const app = await this.getNativeApplication(appName)
      return app == null ? undefined : app.config
    }
    const cauldron = await this.getCauldron()
    return cauldron.config
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
    if (!nativeApplication) {
      throw new Error(`Cannot create platform for unexisting native application ${nativeApplicationName}`)
    }
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
    if (!nativeApplication) {
      throw new Error(`Cannot remove platform of unexisting native application ${nativeApplicationName}`)
    }
    if (_.remove(nativeApplication.platforms, x => x.name === platformName).length > 0) {
      await this.commit(`Remove ${platformName} platform from ${nativeApplicationName}`)
    }
  }

  async createVersion (
    nativeApplicationName: string,
    platformName: string,
    version: any) {
    const platform = await this.getPlatform(nativeApplicationName, platformName)
    if (!platform) {
      throw new Error(`Cannot create version for unexisting ${nativeApplicationName}:${platformName}`)
    }
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
    if (!platform) {
      throw new Error(`Cannot remove version from unexisting ${nativeApplicationName}:${platformName}`)
    }
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
    if (version && validatedVersion.isReleased != null) {
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
    if (version && _.remove(version.nativeDeps, x => x.startsWith(`${dependency}@`)).length > 0) {
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
    if (version) {
      _.remove(version.nativeDeps, x => x.startsWith(`${dependencyName}@`))
      const newDependencyString = `${dependencyName}@${newVersion}`
      version.nativeDeps.push(newDependencyString)
      await this.commit(`Update ${dependencyName} dependency to v${newVersion} for ${nativeApplicationName} ${platformName}`)
    }
  }

  // Only version of miniapps in container can be updated
  async updateMiniAppVersion (
    nativeApplicationName: string,
    platformName: string,
    versionName: string,
    miniApp: any) {
    const version = await this.getVersion(nativeApplicationName, platformName, versionName)
    if (version) {
      let miniAppInContainer = _.find(version.miniApps.container, m => Dependency.same(Dependency.fromString(m), miniApp, { ignoreVersion: true }))
      if (miniAppInContainer) {
        version.miniApps.container = _.map(version.miniApps.container, e => (e === miniAppInContainer) ? miniApp.toString() : e)
        await this.commit(`Update version of ${miniApp.name} MiniApp to ${miniApp.version}`)
      }
    }
  }

  async updateTopLevelContainerVersion (
    nativeApplicationName: string,
    platformName: string,
    newContainerVersion: string) {
    const config = await this.getConfig({ appName: nativeApplicationName, platformName })
    if (config && config.containerGenerator && config.containerGenerator.containerVersion) {
      config.containerGenerator.containerVersion = newContainerVersion
      await this.commit(`Update top level container version to ${newContainerVersion} for ${nativeApplicationName}:${platformName}`)
    } else {
      const platform = await this.getPlatform(nativeApplicationName, platformName)
      if (platform) {
        platform.config = {
          containerGenerator: {
            containerVersion: newContainerVersion
          }
        }
        await this.commit(`Update top level container version to ${newContainerVersion} for ${nativeApplicationName}:${platformName}`)
      }
    }
  }

  async updateContainerVersion (
    nativeApplicationName: string,
    platformName: string,
    versionName: string,
    newContainerVersion: string) {
    const version = await this.getVersion(nativeApplicationName, platformName, versionName)
    if (version) {
      version.containerVersion = newContainerVersion
      await this.commit(`Update container version to ${newContainerVersion} for ${nativeApplicationName}:${platformName}:${versionName}`)
    }
  }

  async getTopLevelContainerVersion (
    nativeApplicationName: string,
    platformName: string
  ) {
    const config = await this.getConfig({ appName: nativeApplicationName, platformName: platformName })
    if (config && config.containerGenerator) {
      return config.containerGenerator.containerVersion
    }
  }

  async getContainerVersion (
    nativeApplicationName: string,
    platformName: string,
    versionName: string
  ) {
    const version = await this.getVersion(nativeApplicationName, platformName, versionName)
    if (version && version.containerVersion) {
      return version.containerVersion
    }
  }

  async removeContainerMiniApp (
    nativeApplicationName: string,
    platformName: string,
    versionName: string,
    miniAppName: string) {
    const version = await this.getVersion(nativeApplicationName, platformName, versionName)
    if (version && _.remove(version.miniApps.container, x => x.startsWith(`${miniAppName}@`)).length > 0) {
      await this.commit(`Remove ${miniAppName} from ${nativeApplicationName} ${platformName} ${versionName} container`)
    }
  }

  async createNativeDependency (
    nativeApplicationName: string,
    platformName: string,
    versionName: string,
    dependency: any) {
    const version = await this.getVersion(nativeApplicationName, platformName, versionName)
    if (version && !version.nativeDeps.includes(dependency.toString())) {
      version.nativeDeps.push(dependency.toString())
      await this.commit(`Add native dependency ${dependency.toString()} to ${nativeApplicationName} ${platformName} ${versionName}`)
    }
  }

  async addCodePushEntry (
    nativeApplicationName: string,
    platformName: string,
    versionName: string,
    codePushEntry: CauldronCodePushEntry) {
    const version = await this.getVersion(nativeApplicationName, platformName, versionName)
    if (version) {
      const deploymentName = codePushEntry.metadata.deploymentName
      version.codePush[deploymentName]
        ? version.codePush[deploymentName].push(codePushEntry)
        : version.codePush[deploymentName] = [ codePushEntry ]
      await this.commit(`New CodePush OTA update`)
    }
  }

  async addContainerMiniApp (
    nativeApplicationName: string,
    platformName: string,
    versionName: string,
    miniapp: any) {
    const version = await this.getVersion(nativeApplicationName, platformName, versionName)
    if (version && !version.miniApps.container.includes(miniapp.toString())) {
      version.miniApps.container.push(miniapp.toString())
      await this.commit(`Add ${miniapp.name} MiniApp to ${nativeApplicationName} ${platformName} ${versionName} container`)
    }
  }

  async validateAndGet (
    nativeApplicationName: string,
    platformName: string,
    versionName: string) {
    let app = await this.getNativeApplication(nativeApplicationName)
    if (!app) {
      throw new Error(`Cannot remove platform of unexisting native application ${nativeApplicationName}`)
    }
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

  async hasYarnLock (
    nativeApplicationName: string,
    platformName: string,
    versionName: string,
    key: string
  ) : Promise<boolean> {
    const version = await this.getVersion(nativeApplicationName, platformName, versionName)
    if (version && version.yarnLocks && version.yarnLocks[key]) {
      return true
    } else {
      return false
    }
  }

  async addYarnLock (
    nativeApplicationName: string,
    platformName: string,
    versionName: string,
    key: string,
    yarnlock: string | Buffer) : Promise<boolean> {
    const version = await this.getVersion(nativeApplicationName, platformName, versionName)

    if (version) {
      const filename = shasum(yarnlock)
      await this._yarnlockStore.storeFile(filename, yarnlock)
      if (!version.yarnLocks) {
        version.yarnLocks = {}
      }
      version.yarnLocks[key] = filename
      await this.commit(`Add yarn.lock for ${nativeApplicationName} ${platformName} ${versionName} ${key}`)
      return true
    }

    return false
  }

  async getYarnLock (
    nativeApplicationName: string,
    platformName: string,
    versionName: string,
    key: string
  ) : Promise<?Buffer> {
    const version = await this.getVersion(nativeApplicationName, platformName, versionName)

    if (version && version.yarnLocks && version.yarnLocks[key]) {
      return this._yarnlockStore.getFile(version.yarnLocks[key])
    }
  }

  async getPathToYarnLock (
    nativeApplicationName: string,
    platformName: string,
    versionName: string,
    key: string
  ) : Promise<?string> {
    const version = await this.getVersion(nativeApplicationName, platformName, versionName)

    if (version && version.yarnLocks && version.yarnLocks[key]) {
      return this._yarnlockStore.getPathToFile(version.yarnLocks[key])
    }
  }

  async removeYarnLock (
    nativeApplicationName: string,
    platformName: string,
    versionName: string,
    key: string
  ) : Promise<boolean> {
    const version = await this.getVersion(nativeApplicationName, platformName, versionName)

    if (version && version.yarnLocks && version.yarnLocks[key]) {
      if (await this._yarnlockStore.removeFile(version.yarnLocks[key])) {
        delete version.yarnLocks[key]
        await this.commit(`Remove yarn.lock for ${nativeApplicationName} ${platformName} ${versionName} ${key}`)
        return true
      }
    }

    return false
  }

  async updateYarnLock (
    nativeApplicationName: string,
    platformName: string,
    versionName: string,
    key: string,
    yarnlock: string | Buffer
  ) : Promise<boolean> {
    const version = await this.getVersion(nativeApplicationName, platformName, versionName)

    if (version && version.yarnLocks && version.yarnLocks[key]) {
      await this._yarnlockStore.removeFile(version.yarnLocks[key])
      const filename = shasum(yarnlock)
      await this._yarnlockStore.storeFile(filename, yarnlock)
      version.yarnlock = filename
      await this.commit(`Updated yarn.lock for ${nativeApplicationName} ${platformName} ${versionName} ${key}`)
    }

    return false
  }

  async setYarnLocks (
    nativeApplicationName: string,
    platformName: string,
    versionName: string,
    yarnLocks: Object
  ) {
    const version = await this.getVersion(nativeApplicationName, platformName, versionName)
    if (version && version.yarnLocks) {
      version.yarnLocks = yarnLocks
      await this.commit(`Set yarn locks for ${nativeApplicationName} ${platformName} ${versionName}`)
    }
  }
}
