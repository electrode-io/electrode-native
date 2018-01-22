// @flow

import * as schemas from './schemas'
import { PackagePath } from 'ern-core'
import {
  exists,
  joiValidate,
  shasum
} from './util'
import _ from 'lodash'
import type {
  CauldronCodePushEntry,
  ICauldronDocumentStore,
  ICauldronFileStore
} from './FlowTypes'

export default class CauldronApi {
  _db: ICauldronDocumentStore
  _sourceMapStore: ICauldronFileStore
  _yarnlockStore: ICauldronFileStore

  constructor (
    db: ICauldronDocumentStore,
    sourcemapStore: ICauldronFileStore,
    yarnlockStore: ICauldronFileStore) {
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

  async getCauldronSchemaVersion () : Promise<string> {
    const cauldron = await this.getCauldron()
    return cauldron.schemaVersion
  }

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
    if (version) {
      return version.container.miniApps
    }
  }

  async getJsApiImpls (
    nativeApplicationName: string,
    platformName: string,
    versionName: string) : Promise<Array<string>> {
    const version = await this.getVersion(nativeApplicationName, platformName, versionName)
    if (!version) {
      throw new Error(`getContainerJsApiImpls: Native application ${nativeApplicationName}:${platformName}${versionName} does not exist`)
    }
    return version.container.jsApiImpls
  }

  async getJsApiImpl (
    nativeApplicationName: string,
    platformName: string,
    versionName: string,
    jsApiImplName: string) : Promise<?string> {
    const jsApiImpls = await this.getJsApiImpls(nativeApplicationName, platformName, versionName)
    return _.find(jsApiImpls, x => (x === jsApiImplName) || x.startsWith(`${jsApiImplName}@`))
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
    return version == null ? [] : version.container.nativeDeps
  }

  async getNativeDependency (
    nativeApplicationName: string,
    platformName: string,
    versionName: string,
    nativedepName: string) {
    const nativeDeps = await this.getNativeDependencies(nativeApplicationName, platformName, versionName)
    return _.find(nativeDeps, x => (x === nativedepName || x.startsWith(`${nativedepName}@`)))
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
    return this.commit('Clear Cauldron')
  }

  async createNativeApplication (nativeApplication: any) {
    const cauldron = await this.getCauldron()
    const appName = nativeApplication.name
    if (exists(cauldron.nativeApps, appName)) {
      throw new Error(`${appName} native application already exists in the Cauldron`)
    }

    const validatedNativeApplication = await joiValidate(nativeApplication, schemas.nativeApplication)
    cauldron.nativeApps.push(validatedNativeApplication)
    return this.commit(`Create ${nativeApplication.name} native application`)
  }

  async removeNativeApplication (appName: string) {
    const cauldron = await this.getCauldron()
    if (!exists(cauldron.nativeApps, appName)) {
      throw new Error(`${appName} native application was not found in the Cauldron`)
    }

    _.remove(cauldron.nativeApps, x => x.name === appName)
    return this.commit(`Remove ${appName} native application`)
  }

  async createPlatform (
    nativeApplicationName: string,
    platform: any) {
    const nativeApplication = await this.getNativeApplication(nativeApplicationName)
    if (!nativeApplication) {
      throw new Error(`Cannot create platform for unexisting native application ${nativeApplicationName}`)
    }
    const platformName = platform.name
    if (exists(nativeApplication.platforms, platform.name)) {
      throw new Error(`${platformName} platform already exists for ${nativeApplicationName} native application`)
    }

    const validatedPlatform = await joiValidate(platform, schemas.nativeApplicationPlatform)
    nativeApplication.platforms.push(validatedPlatform)
    return this.commit(`Create ${platformName} platform for ${nativeApplicationName}`)
  }

  async removePlatform (
    nativeApplicationName: string,
    platformName: string) {
    const nativeApplication = await this.getNativeApplication(nativeApplicationName)
    if (!nativeApplication) {
      throw new Error(`Cannot remove platform of unexisting native application ${nativeApplicationName}`)
    }
    if (!exists(nativeApplication.platforms, platformName)) {
      throw new Error(`${platformName} platform does not exist for ${nativeApplicationName} native application`)
    }

    _.remove(nativeApplication.platforms, x => x.name === platformName)
    return this.commit(`Remove ${platformName} platform from ${nativeApplicationName}`)
  }

  async createVersion (
    nativeApplicationName: string,
    platformName: string,
    version: any) {
    const platform = await this.getPlatform(nativeApplicationName, platformName)
    if (!platform) {
      throw new Error(`Cannot create version for unexisting ${nativeApplicationName}:${platformName}`)
    }
    const versionName = version.name
    if (exists(platform.versions, versionName)) {
      throw new Error(`${versionName} version already exists for ${nativeApplicationName} ${platformName}`)
    }

    const validatedVersion = await joiValidate(version, schemas.nativeApplicationVersion)
    platform.versions.push(validatedVersion)
    return this.commit(`Create version ${version.name} of ${nativeApplicationName} ${platformName}`)
  }

  async removeVersion (
    nativeApplicationName: string,
    platformName: string,
    versionName: string) {
    const platform = await this.getPlatform(nativeApplicationName, platformName)
    if (!platform) {
      throw new Error(`Cannot remove version from unexisting ${nativeApplicationName}:${platformName}`)
    }
    if (!exists(platform.versions, versionName)) {
      throw new Error(`${versionName} version does not exist for ${nativeApplicationName} ${platformName}`)
    }

    _.remove(platform.versions, x => x.name === versionName)
    return this.commit(`Remove version ${versionName} from ${nativeApplicationName} ${platformName}`)
  }

  async updateVersion (
    nativeApplicationName: string,
    platformName: string,
    versionName: string,
    newVersion: any) {
    const validatedVersion = await joiValidate(newVersion, schemas.nativeAplicationVersionPatch)
    const version = await this.getVersion(nativeApplicationName, platformName, versionName)
    if (!version) {
      throw new Error(`Cannot update version of unexisting version ${versionName} of ${nativeApplicationName} ${platformName}`)
    }
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
    if (!version) {
      throw new Error(`${versionName} version does not exist for ${nativeApplicationName} ${platformName}`)
    }
    if (!_.some(version.container.nativeDeps, x => x.startsWith(`${dependency}@`))) {
      throw new Error(`${dependency} dependency does not exists in ${nativeApplicationName} ${platformName} ${versionName}`)
    }

    _.remove(version.container.nativeDeps, x => x.startsWith(`${dependency}@`))
    return this.commit(`Remove ${dependency} dependency from ${nativeApplicationName} ${platformName}`)
  }

  async updateNativeDependency (
    nativeApplicationName: string,
    platformName: string,
    versionName: string,
    dependencyName: string,
    newVersion: string) {
    const version = await this.getVersion(nativeApplicationName, platformName, versionName)
    if (!version) {
      throw new Error(`${versionName} version does not exist for ${nativeApplicationName} ${platformName}`)
    }
    if (!_.some(version.container.nativeDeps, x => x.startsWith(`${dependencyName}@`))) {
      throw new Error(`${dependencyName} dependency does not exists in ${nativeApplicationName} ${platformName} ${versionName}`)
    }

    _.remove(version.container.nativeDeps, x => x.startsWith(`${dependencyName}@`))
    const newDependencyString = `${dependencyName}@${newVersion}`
    version.container.nativeDeps.push(newDependencyString)
    return this.commit(`Update ${dependencyName} dependency to v${newVersion} for ${nativeApplicationName} ${platformName}`)
  }

  async updateMiniAppVersion (
    nativeApplicationName: string,
    platformName: string,
    versionName: string,
    miniApp: PackagePath) {
    const version = await this.getVersion(nativeApplicationName, platformName, versionName)
    if (!version) {
      throw new Error(`${versionName} version does not exist for ${nativeApplicationName} ${platformName}`)
    }

    const miniAppInContainer = _.find(version.container.miniApps, m => miniApp.same(PackagePath.fromString(m), { ignoreVersion: true }))
    if (!miniAppInContainer) {
      throw new Error(`${miniApp.basePath} does not exist in version ${versionName} of ${nativeApplicationName} ${platformName}`)
    }

    version.container.miniApps = _.map(version.container.miniApps, e => (e === miniAppInContainer) ? miniApp.toString() : e)
    return this.commit(`Update version of ${miniApp.basePath} MiniApp to ${miniApp.version || ''} `)
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
        platform.config = platform.config || {}
        platform.config.containerGenerator = platform.config.containerGenerator || {}
        platform.config.containerGenerator.containerVersion = newContainerVersion
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
    if (!version) {
      throw new Error(`${versionName} version does not exist for ${nativeApplicationName} ${platformName}`)
    }
    version.containerVersion = newContainerVersion
    return this.commit(`Update container version to ${newContainerVersion} for ${nativeApplicationName}:${platformName}:${versionName}`)
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
    if (!version) {
      throw new Error(`${versionName} version does not exist for ${nativeApplicationName} ${platformName}`)
    }

    return version.containerVersion
  }

  async removeContainerMiniApp (
    nativeApplicationName: string,
    platformName: string,
    versionName: string,
    miniAppName: string) {
    const version = await this.getVersion(nativeApplicationName, platformName, versionName)
    if (!version) {
      throw new Error(`${versionName} version does not exist for ${nativeApplicationName} ${platformName}`)
    }
    if (!_.some(version.container.miniApps, x => x.startsWith(`${miniAppName}@`))) {
      throw new Error(`${miniAppName} does not exist in version ${versionName} of ${nativeApplicationName} ${platformName}`)
    }

    _.remove(version.container.miniApps, x => x.startsWith(`${miniAppName}@`))
    return this.commit(`Remove ${miniAppName} from ${nativeApplicationName} ${platformName} ${versionName} container`)
  }

  async removeJsApiImpl (
    nativeApplicationName: string,
    platformName: string,
    versionName: string,
    jsApiImplName: string) {
    const version = await this.getVersion(nativeApplicationName, platformName, versionName)
    if (!version) {
      throw new Error(`${versionName} version does not exist for ${nativeApplicationName} ${platformName}`)
    }
    if (!_.some(version.container.jsApiImpls, x => x === jsApiImplName || x.startsWith(`${jsApiImplName}@`))) {
      throw new Error(`${jsApiImplName} does not exist in version ${versionName} of ${nativeApplicationName} ${platformName}`)
    }

    _.remove(version.container.jsApiImpls, x => x === jsApiImplName || x.startsWith(`${jsApiImplName}@`))
    return this.commit(`Remove ${jsApiImplName} from ${nativeApplicationName} ${platformName} ${versionName} container`)
  }

  async updateJsApiImpl (
    nativeApplicationName: string,
    platformName: string,
    versionName: string,
    jsApiImplName: string,
    newVersion: string) {
    const version = await this.getVersion(nativeApplicationName, platformName, versionName)
    if (!version) {
      throw new Error(`${versionName} version does not exist for ${nativeApplicationName} ${platformName}`)
    }
    if (!_.some(version.container.jsApiImpls, x => x.startsWith(`${jsApiImplName}@`))) {
      throw new Error(`${jsApiImplName} JS API implementation does not exists in ${nativeApplicationName} ${platformName} ${versionName}`)
    }

    _.remove(version.container.jsApiImpls, x => x.startsWith(`${jsApiImplName}@`))
    const newJsApiImplString = `${jsApiImplName}@${newVersion}`
    version.container.jsApiImpls.push(newJsApiImplString)
    return this.commit(`Update ${jsApiImplName} JS API implementation to v${newVersion} for ${nativeApplicationName} ${platformName}`)
  }

  async createNativeDependency (
    nativeApplicationName: string,
    platformName: string,
    versionName: string,
    dependency: PackagePath) {
    const version = await this.getVersion(nativeApplicationName, platformName, versionName)
    if (!version) {
      throw new Error(`${versionName} version does not exist for ${nativeApplicationName} ${platformName}`)
    }
    if (version.container.nativeDeps.includes(dependency.toString())) {
      throw new Error(`${dependency.basePath} already exists in version ${versionName} of ${nativeApplicationName} ${platformName}`)
    }

    version.container.nativeDeps.push(dependency.toString())
    return this.commit(`Add native dependency ${dependency.toString()} to ${nativeApplicationName} ${platformName} ${versionName}`)
  }

  async addJsApiImpl (
    nativeApplicationName: string,
    platformName: string,
    versionName: string,
    jsApiImpl: PackagePath) {
    const version = await this.getVersion(nativeApplicationName, platformName, versionName)
    if (!version) {
      throw new Error(`${versionName} version does not exist for ${nativeApplicationName} ${platformName}`)
    }
    if (version.container.jsApiImpls.includes(jsApiImpl.toString())) {
      throw new Error(`${jsApiImpl.basePath} already exists in version ${versionName} of ${nativeApplicationName} ${platformName}`)
    }

    version.container.jsApiImpls.push(jsApiImpl.toString())
    return this.commit(`Add JS API implementation ${jsApiImpl.toString()} to ${nativeApplicationName} ${platformName} ${versionName}`)
  }

  async addCodePushEntry (
    nativeApplicationName: string,
    platformName: string,
    versionName: string,
    codePushEntry: CauldronCodePushEntry) {
    const version = await this.getVersion(nativeApplicationName, platformName, versionName)
    if (!version) {
      throw new Error(`${versionName} version does not exist for ${nativeApplicationName} ${platformName}`)
    }

    const deploymentName = codePushEntry.metadata.deploymentName
    version.codePush[deploymentName]
      ? version.codePush[deploymentName].push(codePushEntry)
      : version.codePush[deploymentName] = [ codePushEntry ]
    return this.commit(`New CodePush OTA update`)
  }

  async setCodePushEntries (
    nativeApplicationName: string,
    platformName: string,
    versionName: string,
    deploymentName: string,
    codePushEntries: Array<CauldronCodePushEntry>) {
    const version = await this.getVersion(nativeApplicationName, platformName, versionName)
    if (!version) {
      throw new Error(`${versionName} version does not exist for ${nativeApplicationName} ${platformName}`)
    }
    if (!version.codePush) {
      version.codePush = {}
    }

    version.codePush[deploymentName] = codePushEntries
    return this.commit('Set codePush entries')
  }

  async addContainerMiniApp (
    nativeApplicationName: string,
    platformName: string,
    versionName: string,
    miniapp: PackagePath) {
    const version = await this.getVersion(nativeApplicationName, platformName, versionName)
    if (!version) {
      throw new Error(`${versionName} version does not exist for ${nativeApplicationName} ${platformName}`)
    }
    if (version.container.miniApps.includes(miniapp.toString())) {
      throw new Error(`${miniapp.basePath} MiniApp already exists in version ${versionName} of ${nativeApplicationName} ${platformName}`)
    }

    version.container.miniApps.push(miniapp.toString())
    return this.commit(`Add ${miniapp.basePath} MiniApp to ${nativeApplicationName} ${platformName} ${versionName} container`)
  }

  // =====================================================================================
  // FILE OPERATIONS
  // =====================================================================================

  async hasYarnLock (
    nativeApplicationName: string,
    platformName: string,
    versionName: string,
    key: string
  ) : Promise<boolean> {
    const version = await this.getVersion(nativeApplicationName, platformName, versionName)
    if (!version) {
      throw new Error(`${versionName} version does not exist for ${nativeApplicationName} ${platformName}`)
    }
    if (version.yarnLocks && version.yarnLocks[key]) {
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
    yarnlock: string | Buffer) {
    const version = await this.getVersion(nativeApplicationName, platformName, versionName)
    if (!version) {
      throw new Error(`${versionName} version does not exist for ${nativeApplicationName} ${platformName}`)
    }

    const filename = shasum(yarnlock)
    await this._yarnlockStore.storeFile(filename, yarnlock)
    if (!version.yarnLocks) {
      version.yarnLocks = {}
    }
    version.yarnLocks[key] = filename
    return this.commit(`Add yarn.lock for ${nativeApplicationName} ${platformName} ${versionName} ${key}`)
  }

  async getYarnLockId (
    nativeApplicationName: string,
    platformName: string,
    versionName: string,
    key: string
  ) : Promise<?string> {
    const version = await this.getVersion(nativeApplicationName, platformName, versionName)
    if (!version) {
      throw new Error(`${versionName} version does not exist for ${nativeApplicationName} ${platformName}`)
    }
    return version.yarnLocks && version.yarnLocks[key]
  }

  async setYarnLockId (
    nativeApplicationName: string,
    platformName: string,
    versionName: string,
    key: string,
    id: string
  ) {
    const version = await this.getVersion(nativeApplicationName, platformName, versionName)
    if (!version) {
      throw new Error(`${versionName} version does not exist for ${nativeApplicationName} ${platformName}`)
    }
    if (!version.yarnLocks) {
      version.yarnLocks = {}
    }

    version.yarnLocks[key] = id
    return this.commit(`Add yarn.lock for ${nativeApplicationName} ${platformName} ${versionName} ${key}`)
  }

  async getYarnLock (
    nativeApplicationName: string,
    platformName: string,
    versionName: string,
    key: string
  ) : Promise<?Buffer> {
    const version = await this.getVersion(nativeApplicationName, platformName, versionName)
    if (!version) {
      throw new Error(`${versionName} version does not exist for ${nativeApplicationName} ${platformName}`)
    }
    if (version.yarnLocks && version.yarnLocks[key]) {
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
    if (!version) {
      throw new Error(`${versionName} version does not exist for ${nativeApplicationName} ${platformName}`)
    }
    if (version.yarnLocks && version.yarnLocks[key]) {
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
    if (!version) {
      throw new Error(`${versionName} version does not exist for ${nativeApplicationName} ${platformName}`)
    }
    if (version.yarnLocks && version.yarnLocks[key]) {
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
    if (!version) {
      throw new Error(`${versionName} version does not exist for ${nativeApplicationName} ${platformName}`)
    }
    if (version.yarnLocks && version.yarnLocks[key]) {
      await this._yarnlockStore.removeFile(version.yarnLocks[key])
      const filename = shasum(yarnlock)
      await this._yarnlockStore.storeFile(filename, yarnlock)
      version.yarnLocks[key] = filename
      await this.commit(`Updated yarn.lock for ${nativeApplicationName} ${platformName} ${versionName} ${key}`)
      return true
    }

    return false
  }

  async updateYarnLockId (
    nativeApplicationName: string,
    platformName: string,
    versionName: string,
    key: string,
    id: string
  ) {
    const version = await this.getVersion(nativeApplicationName, platformName, versionName)
    if (!version) {
      throw new Error(`${versionName} version does not exist for ${nativeApplicationName} ${platformName}`)
    }
    if (version.yarnLocks) {
      if (version.yarnLocks[key]) {
        await this._yarnlockStore.removeFile(version.yarnLocks[key])
      }
      version.yarnLocks[key] = id
      await this.commit(`Updated yarn.lock id for ${nativeApplicationName} ${platformName} ${versionName} ${key}`)
    }
  }

  async setYarnLocks (
    nativeApplicationName: string,
    platformName: string,
    versionName: string,
    yarnLocks: Object
  ) {
    const version = await this.getVersion(nativeApplicationName, platformName, versionName)
    if (!version) {
      throw new Error(`${versionName} version does not exist for ${nativeApplicationName} ${platformName}`)
    }
    if (version.yarnLocks) {
      version.yarnLocks = yarnLocks
      await this.commit(`Set yarn locks for ${nativeApplicationName} ${platformName} ${versionName}`)
    }
  }

  async addPublisher (nativeAppName: string, platformName: ('ios' | 'android'), publisherType: ('maven' | 'github'), url: string) {
    try {
      const platform = await this.getPlatform(nativeAppName, platformName)
      if (platform) {
        platform.config = platform.config || {}
        platform.config.containerGenerator = platform.config.containerGenerator || {}
        platform.config.containerGenerator.publishers = platform.config.containerGenerator.publishers || []

        for (const publisher of platform.config.containerGenerator.publishers) {
          if (publisher.name === publisherType) {
            throw new Error(`${publisherType} publisher(${publisher.url}) already exists for ${nativeAppName}:${platformName}`)
          }
        }

        platform.config.containerGenerator.publishers.push({
          'name': publisherType,
          'url': url
        })

        await this.commit(`Add ${publisherType} publisher for ${nativeAppName}:${platformName}`)
      } else {
        throw new Error(`${nativeAppName}:${platformName} is not present in cauldron`)
      }
    } catch (e) {
      throw new Error(`[cauldronApi] addPublisher: ${e}`)
    }
  }
}
