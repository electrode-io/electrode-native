// @flow

import * as schemas from './schemas'
import {
  NativeApplicationDescriptor,
  PackagePath
} from 'ern-core'
import {
  exists,
  joiValidate,
  shasum
} from './util'
import _ from 'lodash'
import type {
  CauldronCodePushEntry,
  CauldronNativeApp,
  CauldronNativeAppPlatform,
  CauldronNativeAppVersion,
  ICauldronDocumentStore,
  ICauldronFileStore
} from './FlowTypes'
import upgradeScripts from './upgrade-scripts/scripts'

export default class CauldronApi {
  _db: ICauldronDocumentStore
  _sourceMapStore: ICauldronFileStore
  _yarnlockStore: ICauldronFileStore
  _bundleStore: ICauldronFileStore

  constructor (
    db: ICauldronDocumentStore,
    sourcemapStore: ICauldronFileStore,
    yarnlockStore: ICauldronFileStore,
    bundleStore: ICauldronFileStore) {
    this._db = db
    this._sourceMapStore = sourcemapStore
    this._yarnlockStore = yarnlockStore
    this._bundleStore = bundleStore
  }

  async commit (message: string) : Promise<void> {
    return this._db.commit(message)
  }

  async getCauldron () : Promise<Object> {
    return this._db.getCauldron()
  }

  // =====================================================================================
  // CAULDRON SCHEMA UPGRADE
  // =====================================================================================

  async upgradeCauldronSchema () : Promise<void> {
    const currentSchemaVersion = await this.getCauldronSchemaVersion()
    if (currentSchemaVersion === schemas.schemaVersion) {
      throw new Error(`The Cauldron is already using the proper schema version ${currentSchemaVersion}`)
    }
    let isUpgradeStarted = false
    // We apply all upgrade scripts, one by one, starting from the current schema version
    for (const upgradeScript of upgradeScripts) {
      if (upgradeScript.from === currentSchemaVersion) {
        isUpgradeStarted = true
      }
      if (isUpgradeStarted) {
        await upgradeScript.upgrade(this)
      }
    }
  }

  // =====================================================================================
  // TRANSACTION MANAGEMENT
  // =====================================================================================

  async beginTransaction () : Promise<void> {
    await this._db.beginTransaction()
    await this._yarnlockStore.beginTransaction()
  }

  async discardTransaction () : Promise<void> {
    await this._db.discardTransaction()
    await this._yarnlockStore.discardTransaction()
  }

  async commitTransaction (message: string | Array<string>) : Promise<void> {
    await this._db.commitTransaction(message)
    await this._yarnlockStore.commitTransaction(message)
  }

  // =====================================================================================
  // READ OPERATIONS
  // =====================================================================================

  async getCauldronSchemaVersion () : Promise<string> {
    const cauldron = await this.getCauldron()
    return cauldron.schemaVersion || '0.0.0'
  }

  async getDescriptor (descriptor: NativeApplicationDescriptor) : Promise<Object> {
    if (descriptor.version) {
      return this.getVersion(descriptor)
    } else if (descriptor.platform) {
      return this.getPlatform(descriptor)
    } else {
      return this.getNativeApplication(descriptor)
    }
  }

  async getNativeApplications () : Promise<Array<CauldronNativeApp>> {
    const cauldron = await this.getCauldron()
    return cauldron.nativeApps
  }

  async hasDescriptor (descriptor: NativeApplicationDescriptor) : Promise<boolean> {
    if (descriptor.version) {
      return this.hasVersion(descriptor)
    } else if (descriptor.platform) {
      return this.hasPlatform(descriptor)
    } else {
      return this.hasNativeApplication(descriptor)
    }
  }

  async hasNativeApplication (descriptor: NativeApplicationDescriptor) : Promise<boolean> {
    const cauldron = await this.getCauldron()
    const result = _.find(cauldron.nativeApps, n => n.name === descriptor.name)
    return result != null
  }

  async hasPlatform (descriptor: NativeApplicationDescriptor) : Promise<boolean> {
    if (!await this.hasNativeApplication(descriptor)) {
      return false
    }
    const platforms = await this.getPlatforms(descriptor)
    const result = _.find(platforms, p => p.name === descriptor.platform)
    return result != null
  }

  async hasVersion (descriptor: NativeApplicationDescriptor) : Promise<boolean> {
    if (!await this.hasPlatform(descriptor)) {
      return false
    }
    const versions = await this.getVersions(descriptor)
    const result = _.find(versions, v => v.name === descriptor.version)
    return result != null
  }

  async getNativeApplication (descriptor: NativeApplicationDescriptor) : Promise<CauldronNativeApp> {
    const cauldron = await this.getCauldron()
    const result = _.find(cauldron.nativeApps, n => n.name === descriptor.name)
    if (!result) {
      throw new Error(`Cannot find ${descriptor.toString()} in Cauldron`)
    }
    return result
  }

  async getPlatforms (descriptor: NativeApplicationDescriptor) : Promise<Array<CauldronNativeAppPlatform>> {
    const app = await this.getNativeApplication(descriptor)
    return app.platforms
  }

  async getPlatform (descriptor: NativeApplicationDescriptor) : Promise<CauldronNativeAppPlatform> {
    const platforms = await this.getPlatforms(descriptor)
    const result = _.find(platforms, p => p.name === descriptor.platform)
    if (!result) {
      throw new Error(`Cannot find ${descriptor.toString()} in Cauldron`)
    }
    return result
  }

  async getVersions (descriptor: NativeApplicationDescriptor) : Promise<Array<CauldronNativeAppVersion>> {
    const platform = await this.getPlatform(descriptor)
    return platform.versions
  }

  async getVersion (descriptor: NativeApplicationDescriptor) : Promise<CauldronNativeAppVersion> {
    const versions = await this.getVersions(descriptor)
    const result = _.find(versions, v => v.name === descriptor.version)
    if (!result) {
      throw new Error(`Cannot find ${descriptor.toString()} in Cauldron`)
    }
    return result
  }

  async getCodePushEntries (
    descriptor: NativeApplicationDescriptor,
    deploymentName: string) : Promise<Array<CauldronCodePushEntry>> {
    this.throwIfPartialNapDescriptor(descriptor)
    const version = await this.getVersion(descriptor)
    const result = version.codePush[deploymentName]
    return result
  }

  async getContainerMiniApps (descriptor: NativeApplicationDescriptor) : Promise<Array<string>> {
    this.throwIfPartialNapDescriptor(descriptor)
    const version = await this.getVersion(descriptor)
    return version.container.miniApps
  }

  async getContainerJsApiImpls (descriptor: NativeApplicationDescriptor) : Promise<Array<string>> {
    this.throwIfPartialNapDescriptor(descriptor)
    const version = await this.getVersion(descriptor)
    return version.container.jsApiImpls
  }

  async getContainerJsApiImpl (
    descriptor: NativeApplicationDescriptor,
    jsApiImplName: string) : Promise<string> {
    const jsApiImpls = await this.getContainerJsApiImpls(descriptor)
    const result = _.find(jsApiImpls, x => (x === jsApiImplName) || x.startsWith(`${jsApiImplName}@`))
    if (!result) {
      throw new Error(`Cannot find ${jsApiImplName} JS API implementation in ${descriptor.toString()} Container`)
    }
    return result
  }

  async isMiniAppInContainer (
    descriptor: NativeApplicationDescriptor,
    miniAppName: string) : Promise<boolean> {
    this.throwIfPartialNapDescriptor(descriptor)
    const miniApps = await this.getContainerMiniApps(descriptor)
    const result = _.find(miniApps, m => m.startsWith(miniAppName))
    if (!result) {
      return false
    } else {
      return true
    }
  }

  async getContainerMiniApp (
    descriptor: NativeApplicationDescriptor,
    miniAppName: string) : Promise<string> {
    this.throwIfPartialNapDescriptor(descriptor)
    const miniApps = await this.getContainerMiniApps(descriptor)
    const result = _.find(miniApps, m => m.startsWith(miniAppName))
    if (!result) {
      throw new Error(`Cannot find ${miniAppName} MiniApp in ${descriptor.toString()} Container`)
    }
    return result
  }

  async getNativeDependencies (descriptor: NativeApplicationDescriptor) : Promise<Array<string>> {
    this.throwIfPartialNapDescriptor(descriptor)
    const version = await this.getVersion(descriptor)
    return version.container.nativeDeps
  }

  async isNativeDependencyInContainer (
    descriptor: NativeApplicationDescriptor,
    nativeDepName: string) : Promise<boolean> {
    this.throwIfPartialNapDescriptor(descriptor)
    const nativeDeps = await this.getNativeDependencies(descriptor)
    const result = _.find(nativeDeps, x => (x === nativeDepName || x.startsWith(`${nativeDepName}@`)))
    if (!result) {
      return false
    } else {
      return true
    }
  }

  async getContainerNativeDependency (
    descriptor: NativeApplicationDescriptor,
    nativeDepName: string) : Promise<string> {
    this.throwIfPartialNapDescriptor(descriptor)
    const nativeDeps = await this.getNativeDependencies(descriptor)
    const result = _.find(nativeDeps, x => (x === nativeDepName || x.startsWith(`${nativeDepName}@`)))
    if (!result) {
      throw new Error(`Cannot find ${nativeDepName} native dependency in ${descriptor.toString()} Container`)
    }
    return result
  }

  async getConfig (descriptor?: NativeApplicationDescriptor) : Promise<?Object> {
    if (descriptor) {
      if (descriptor.platform) {
        if (descriptor.version) {
          const version = await this.getVersion(descriptor)
          return version.config
        }
        const platform = await this.getPlatform(descriptor)
        return platform.config
      }
      const app = await this.getNativeApplication(descriptor)
      return app.config
    }
    const cauldron = await this.getCauldron()
    return cauldron.config
  }

  // =====================================================================================
  // WRITE OPERATIONS
  // =====================================================================================

  async clearCauldron () : Promise<void> {
    const cauldron = await this.getCauldron()
    cauldron.nativeApps = []
    return this.commit('Clear Cauldron')
  }

  async addDescriptor (descriptor: NativeApplicationDescriptor) : Promise<void> {
    if (!await this.hasNativeApplication(descriptor)) {
      await this.createNativeApplication({name: descriptor.name})
    }
    if (descriptor.platform && !await this.hasPlatform(descriptor)) {
      await this.createPlatform(descriptor, {name: descriptor.platform})
    }
    if (descriptor.version && !await this.hasVersion(descriptor)) {
      await this.createVersion(descriptor, {name: descriptor.version})
    }
  }

  async removeDescriptor (descriptor: NativeApplicationDescriptor) : Promise<void> {
    if (descriptor.version) {
      return this.removeVersion(descriptor)
    } else if (descriptor.platform) {
      return this.removePlatform(descriptor)
    } else {
      return this.removeNativeApplication(descriptor)
    }
  }

  async createNativeApplication (nativeApplication: Object) : Promise<void> {
    const cauldron = await this.getCauldron()
    if (exists(cauldron.nativeApps, nativeApplication.name)) {
      throw new Error(`${nativeApplication.name} already exists`)
    }
    const validatedNativeApplication = await joiValidate(nativeApplication, schemas.nativeApplication)
    cauldron.nativeApps.push(validatedNativeApplication)
    return this.commit(`Create ${nativeApplication.name} native application`)
  }

  async removeNativeApplication (descriptor: NativeApplicationDescriptor) : Promise<void> {
    const cauldron = await this.getCauldron()
    if (!exists(cauldron.nativeApps, descriptor.name)) {
      throw new Error(`${descriptor.name} was not found in Cauldron`)
    }
    _.remove(cauldron.nativeApps, x => x.name === descriptor.name)
    return this.commit(`Remove ${descriptor.toString()}`)
  }

  async createPlatform (
    descriptor: NativeApplicationDescriptor,
    platform: Object) : Promise<void> {
    const nativeApplication = await this.getNativeApplication(descriptor)
    const platformName = platform.name
    if (exists(nativeApplication.platforms, platform.name)) {
      throw new Error(`${platformName} platform already exists for ${descriptor.toString()}`)
    }
    const validatedPlatform = await joiValidate(platform, schemas.nativeApplicationPlatform)
    nativeApplication.platforms.push(validatedPlatform)
    return this.commit(`Create ${platformName} platform for ${descriptor.toString()}`)
  }

  async removePlatform (descriptor: NativeApplicationDescriptor) {
    const platform = descriptor.platform
    if (!platform) {
      throw new Error('removePlatform: descriptor should include the platform to be removed')
    }
    const nativeApplication = await this.getNativeApplication(descriptor)
    if (!exists(nativeApplication.platforms, platform)) {
      throw new Error(`${platform} platform does not exist for ${descriptor.name} native application`)
    }
    _.remove(nativeApplication.platforms, x => x.name === platform)
    return this.commit(`Remove ${descriptor.toString()}`)
  }

  async createVersion (
    descriptor: NativeApplicationDescriptor,
    version: Object) : Promise<void> {
    const platform = await this.getPlatform(descriptor)
    const versionName = version.name
    if (exists(platform.versions, versionName)) {
      throw new Error(`${versionName} version already exists for ${descriptor.toString()}`)
    }
    const validatedVersion = await joiValidate(version, schemas.nativeApplicationVersion)
    platform.versions.push(validatedVersion)
    return this.commit(`Create version ${versionName} for ${descriptor.toString()}`)
  }

  async removeVersion (descriptor: NativeApplicationDescriptor) : Promise<void> {
    const versionName = descriptor.version
    if (!versionName) {
      throw new Error('removeVersion: descriptor should include the version to be removed')
    }
    const platform = await this.getPlatform(descriptor)
    if (!exists(platform.versions, versionName)) {
      throw new Error(`${versionName} version does not exist for ${descriptor.toString()}`)
    }
    _.remove(platform.versions, x => x.name === versionName)
    return this.commit(`Remove ${descriptor.toString()}`)
  }

  async updateVersion (
    descriptor: NativeApplicationDescriptor,
    newVersion: any) : Promise<void> {
    this.throwIfPartialNapDescriptor(descriptor)
    const validatedVersion = await joiValidate(newVersion, schemas.nativeAplicationVersionPatch)
    const version = await this.getVersion(descriptor)
    if (validatedVersion.isReleased != null) {
      version.isReleased = validatedVersion.isReleased
      await this.commit(`Update release status of ${descriptor.toString()}`)
    }
  }

  async removeContainerNativeDependency (
    descriptor: NativeApplicationDescriptor,
    dependency: string) : Promise<void> {
    this.throwIfPartialNapDescriptor(descriptor)
    const version = await this.getVersion(descriptor)
    if (!_.some(version.container.nativeDeps, x => x.startsWith(`${dependency}@`))) {
      throw new Error(`${dependency} dependency does not exists in ${descriptor.toString()} Container`)
    }
    _.remove(version.container.nativeDeps, x => x.startsWith(`${dependency}@`))
    return this.commit(`Remove ${dependency} dependency from ${descriptor.toString()} Container`)
  }

  async updateContainerNativeDependencyVersion (
    descriptor: NativeApplicationDescriptor,
    dependencyName: string,
    newVersion: string) : Promise<void> {
    this.throwIfPartialNapDescriptor(descriptor)
    const version = await this.getVersion(descriptor)
    if (!_.some(version.container.nativeDeps, x => x.startsWith(`${dependencyName}@`))) {
      throw new Error(`${dependencyName} dependency does not exists in ${descriptor.toString()} Container`)
    }
    _.remove(version.container.nativeDeps, x => x.startsWith(`${dependencyName}@`))
    const newDependencyString = `${dependencyName}@${newVersion}`
    version.container.nativeDeps.push(newDependencyString)
    return this.commit(`Update ${dependencyName} dependency to v${newVersion} in ${descriptor.toString()} Container`)
  }

  async updateContainerMiniAppVersion (
    descriptor: NativeApplicationDescriptor,
    miniApp: PackagePath) : Promise<void> {
    this.throwIfPartialNapDescriptor(descriptor)
    const version = await this.getVersion(descriptor)
    const miniAppInContainer = _.find(version.container.miniApps, m => miniApp.same(PackagePath.fromString(m), { ignoreVersion: true }))
    if (!miniAppInContainer) {
      throw new Error(`${miniApp.basePath} does not exist in version ${descriptor.toString()} Container`)
    }
    version.container.miniApps = _.map(version.container.miniApps, e => (e === miniAppInContainer) ? miniApp.toString() : e)
    return this.commit(`Update version of ${miniApp.basePath} MiniApp to ${miniApp.version || ''} in ${descriptor.toString()} Container`)
  }

  async updateTopLevelContainerVersion (
    descriptor: NativeApplicationDescriptor,
    newContainerVersion: string) : Promise<void> {
    const config = await this.getConfig(descriptor)
    if (config && config.containerGenerator && config.containerGenerator.containerVersion) {
      config.containerGenerator.containerVersion = newContainerVersion
      return this.commit(`Update top level Container version of ${descriptor.toString()} to ${newContainerVersion}`)
    } else {
      const platform = await this.getPlatform(descriptor)
      platform.config = platform.config || {}
      platform.config.containerGenerator = platform.config.containerGenerator || {}
      platform.config.containerGenerator.containerVersion = newContainerVersion
      return this.commit(`Update top level Container version of ${descriptor.toString()} to ${newContainerVersion}`)
    }
  }

  async updateContainerVersion (
    descriptor: NativeApplicationDescriptor,
    newContainerVersion: string) : Promise<void> {
    this.throwIfPartialNapDescriptor(descriptor)
    const version = await this.getVersion(descriptor)
    version.containerVersion = newContainerVersion
    return this.commit(`Update container version of ${descriptor.toString()} to ${newContainerVersion}`)
  }

  async getTopLevelContainerVersion (descriptor: NativeApplicationDescriptor) : Promise<?string> {
    const config = await this.getConfig(descriptor.withoutVersion())
    if (config && config.containerGenerator) {
      return config.containerGenerator.containerVersion
    }
  }

  async getContainerVersion (descriptor: NativeApplicationDescriptor) : Promise<string> {
    this.throwIfPartialNapDescriptor(descriptor)
    const version = await this.getVersion(descriptor)
    return version.containerVersion
  }

  async removeContainerMiniApp (
    descriptor: NativeApplicationDescriptor,
    miniAppName: string) : Promise<void> {
    this.throwIfPartialNapDescriptor(descriptor)
    const version = await this.getVersion(descriptor)
    if (!_.some(version.container.miniApps, x => x.startsWith(`${miniAppName}@`))) {
      throw new Error(`${miniAppName} MiniApp does not exist in ${descriptor.toString()} Container`)
    }
    _.remove(version.container.miniApps, x => x.startsWith(`${miniAppName}@`))
    return this.commit(`Remove ${miniAppName} MiniApp from ${descriptor.toString()} Container`)
  }

  async removeContainerJsApiImpl (
    descriptor: NativeApplicationDescriptor,
    jsApiImplName: string) : Promise<void> {
    this.throwIfPartialNapDescriptor(descriptor)
    const version = await this.getVersion(descriptor)
    if (!_.some(version.container.jsApiImpls, x => x === jsApiImplName || x.startsWith(`${jsApiImplName}@`))) {
      throw new Error(`${jsApiImplName} JS API implementation does not exist in ${descriptor.toString()} Container`)
    }
    _.remove(version.container.jsApiImpls, x => x === jsApiImplName || x.startsWith(`${jsApiImplName}@`))
    return this.commit(`Remove ${jsApiImplName} JS API implementation from ${descriptor.toString()} Container`)
  }

  async updateContainerJsApiImplVersion (
    descriptor: NativeApplicationDescriptor,
    jsApiImplName: string,
    newVersion: string) : Promise<void> {
    this.throwIfPartialNapDescriptor(descriptor)
    const version = await this.getVersion(descriptor)
    if (!_.some(version.container.jsApiImpls, x => x.startsWith(`${jsApiImplName}@`))) {
      throw new Error(`${jsApiImplName} JS API implementation does not exists in ${descriptor.toString()} Container`)
    }
    _.remove(version.container.jsApiImpls, x => x.startsWith(`${jsApiImplName}@`))
    const newJsApiImplString = `${jsApiImplName}@${newVersion}`
    version.container.jsApiImpls.push(newJsApiImplString)
    return this.commit(`Update ${jsApiImplName} JS API implementation to v${newVersion} in ${descriptor.toString()} Container`)
  }

  async addContainerNativeDependency (
    descriptor: NativeApplicationDescriptor,
    dependency: PackagePath) : Promise<void> {
    this.throwIfPartialNapDescriptor(descriptor)
    const version = await this.getVersion(descriptor)
    if (version.container.nativeDeps.includes(dependency.toString())) {
      throw new Error(`${dependency.basePath} already exists in ${descriptor.toString()} Container`)
    }
    version.container.nativeDeps.push(dependency.toString())
    return this.commit(`Add native dependency ${dependency.toString()} in ${descriptor.toString()} Container`)
  }

  async addContainerJsApiImpl (
    descriptor: NativeApplicationDescriptor,
    jsApiImpl: PackagePath) : Promise<void> {
    this.throwIfPartialNapDescriptor(descriptor)
    const version = await this.getVersion(descriptor)
    if (version.container.jsApiImpls.includes(jsApiImpl.toString())) {
      throw new Error(`${jsApiImpl.basePath} already exists in ${descriptor.toString()} Container`)
    }
    version.container.jsApiImpls.push(jsApiImpl.toString())
    return this.commit(`Add JS API implementation ${jsApiImpl.toString()} in ${descriptor.toString()} Container`)
  }

  async hasCodePushEntries (
    descriptor: NativeApplicationDescriptor,
    deploymentName: string) : Promise<boolean> {
    const version = await this.getVersion(descriptor)
    return version.codePush[deploymentName] != null
  }

  async addCodePushEntry (
    descriptor: NativeApplicationDescriptor,
    codePushEntry: CauldronCodePushEntry) : Promise<void> {
    const version = await this.getVersion(descriptor)
    const deploymentName = codePushEntry.metadata.deploymentName
    version.codePush[deploymentName]
      ? version.codePush[deploymentName].push(codePushEntry)
      : version.codePush[deploymentName] = [ codePushEntry ]
    return this.commit(`New CodePush OTA update for ${descriptor.toString()}`)
  }

  async setCodePushEntries (
    descriptor: NativeApplicationDescriptor,
    deploymentName: string,
    codePushEntries: Array<CauldronCodePushEntry>) : Promise<void> {
    this.throwIfPartialNapDescriptor(descriptor)
    const version = await this.getVersion(descriptor)
    version.codePush[deploymentName] = codePushEntries
    return this.commit(`Set codePush entries in ${descriptor.toString()}`)
  }

  async addContainerMiniApp (
    descriptor: NativeApplicationDescriptor,
    miniapp: PackagePath) : Promise<void> {
    this.throwIfPartialNapDescriptor(descriptor)
    const version = await this.getVersion(descriptor)
    if (version.container.miniApps.includes(miniapp.toString())) {
      throw new Error(`${miniapp.basePath} MiniApp already exists in ${descriptor.toString()} Container`)
    }
    version.container.miniApps.push(miniapp.toString())
    return this.commit(`Add ${miniapp.basePath} MiniApp in ${descriptor.toString()} Container`)
  }

  // =====================================================================================
  // FILE OPERATIONS
  // =====================================================================================

  async hasYarnLock (
    descriptor: NativeApplicationDescriptor,
    key: string
  ) : Promise<boolean> {
    this.throwIfPartialNapDescriptor(descriptor)
    const version = await this.getVersion(descriptor)
    if (version.yarnLocks[key]) {
      return true
    } else {
      return false
    }
  }

  async addYarnLock (
    descriptor: NativeApplicationDescriptor,
    key: string,
    yarnlock: string | Buffer) : Promise<void> {
    this.throwIfPartialNapDescriptor(descriptor)
    const version = await this.getVersion(descriptor)
    const filename = shasum(yarnlock)
    await this._yarnlockStore.storeFile(filename, yarnlock)
    version.yarnLocks[key] = filename
    return this.commit(`Add yarn.lock for ${descriptor.toString()} ${key}`)
  }

  async getYarnLockId (
    descriptor: NativeApplicationDescriptor,
    key: string) : Promise<?string> {
    this.throwIfPartialNapDescriptor(descriptor)
    const version = await this.getVersion(descriptor)
    return version.yarnLocks[key]
  }

  async setYarnLockId (
    descriptor: NativeApplicationDescriptor,
    key: string,
    id: string) : Promise<void> {
    this.throwIfPartialNapDescriptor(descriptor)
    const version = await this.getVersion(descriptor)
    version.yarnLocks[key] = id
    return this.commit(`Add yarn.lock for ${descriptor.toString()} ${key}`)
  }

  async getYarnLock (
    descriptor: NativeApplicationDescriptor,
    key: string
  ) : Promise<?Buffer> {
    this.throwIfPartialNapDescriptor(descriptor)
    const version = await this.getVersion(descriptor)
    if (version.yarnLocks[key]) {
      return this._yarnlockStore.getFile(version.yarnLocks[key])
    }
  }

  async getPathToYarnLock (
    descriptor: NativeApplicationDescriptor,
    key: string) : Promise<?string> {
    this.throwIfPartialNapDescriptor(descriptor)
    const version = await this.getVersion(descriptor)
    if (version.yarnLocks[key]) {
      return this._yarnlockStore.getPathToFile(version.yarnLocks[key])
    }
  }

  async removeYarnLock (
    descriptor: NativeApplicationDescriptor,
    key: string) : Promise<boolean> {
    this.throwIfPartialNapDescriptor(descriptor)
    const version = await this.getVersion(descriptor)
    if (version.yarnLocks[key]) {
      if (await this._yarnlockStore.removeFile(version.yarnLocks[key])) {
        delete version.yarnLocks[key]
        await this.commit(`Remove yarn.lock for ${descriptor.toString()} ${key}`)
        return true
      }
    }
    return false
  }

  async updateYarnLock (
    descriptor: NativeApplicationDescriptor,
    key: string,
    yarnlock: string | Buffer) : Promise<boolean> {
    this.throwIfPartialNapDescriptor(descriptor)
    const version = await this.getVersion(descriptor)
    if (version.yarnLocks[key]) {
      await this._yarnlockStore.removeFile(version.yarnLocks[key])
      const filename = shasum(yarnlock)
      await this._yarnlockStore.storeFile(filename, yarnlock)
      version.yarnLocks[key] = filename
      await this.commit(`Updated yarn.lock for ${descriptor.toString()} ${key}`)
      return true
    }
    return false
  }

  async updateYarnLockId (
    descriptor: NativeApplicationDescriptor,
    key: string,
    id: string) {
    this.throwIfPartialNapDescriptor(descriptor)
    const version = await this.getVersion(descriptor)
    if (version.yarnLocks[key]) {
      await this._yarnlockStore.removeFile(version.yarnLocks[key])
    }
    version.yarnLocks[key] = id
    await this.commit(`Updated yarn.lock id for ${descriptor.toString()} ${key}`)
  }

  async setYarnLocks (
    descriptor: NativeApplicationDescriptor,
    yarnLocks: Object) {
    this.throwIfPartialNapDescriptor(descriptor)
    const version = await this.getVersion(descriptor)
    version.yarnLocks = yarnLocks
    await this.commit(`Set yarn locks for ${descriptor.toString()}`)
  }

  async addPublisher (descriptor: NativeApplicationDescriptor, publisherType: ('maven' | 'github'), url: string) {
    try {
      const platform = await this.getPlatform(descriptor)
      platform.config = platform.config || {}
      platform.config.containerGenerator = platform.config.containerGenerator || {}
      platform.config.containerGenerator.publishers = platform.config.containerGenerator.publishers || []
      for (const publisher of platform.config.containerGenerator.publishers) {
        if (publisher.name === publisherType) {
          throw new Error(`${publisherType} publisher(${publisher.url}) already exists for ${descriptor.toString()}`)
        }
      }
      platform.config.containerGenerator.publishers.push({
        'name': publisherType,
        'url': url
      })
      await this.commit(`Add ${publisherType} publisher for ${descriptor.toString()}`)
    } catch (e) {
      throw new Error(`[cauldronApi] addPublisher: ${e}`)
    }
  }

  throwIfPartialNapDescriptor (napDescriptor: NativeApplicationDescriptor) {
    if (napDescriptor.isPartial) {
      throw new Error(`Cannot work with a partial native application descriptor`)
    }
  }
}
