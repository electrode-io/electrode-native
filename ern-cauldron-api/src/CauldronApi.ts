import * as schemas from './schemas'
import { NativeApplicationDescriptor, PackagePath } from 'ern-core'
import { exists, joiValidate, shasum, normalizeCauldronFilePath } from './util'
import _ from 'lodash'
import {
  Cauldron,
  CauldronCodePushEntry,
  CauldronNativeApp,
  CauldronNativeAppPlatform,
  CauldronNativeAppVersion,
  ICauldronDocumentStore,
  ICauldronFileStore,
  CauldronConfigLevel,
} from './types'
import upgradeScripts from './upgrade-scripts/scripts'
import path from 'path'

const yarnLocksStoreDirectory = 'yarnlocks'
const bundlesStoreDirectory = 'bundles'

export default class CauldronApi {
  private readonly documentStore: ICauldronDocumentStore
  private readonly fileStore: ICauldronFileStore

  constructor(
    documentStore: ICauldronDocumentStore,
    fileStore: ICauldronFileStore
  ) {
    this.documentStore = documentStore
    this.fileStore = fileStore
  }

  public async commit(message: string): Promise<void> {
    return this.documentStore.commit(message)
  }

  public async getCauldron(): Promise<Cauldron> {
    return this.documentStore.getCauldron()
  }

  // =====================================================================================
  // CAULDRON SCHEMA UPGRADE
  // =====================================================================================

  public async upgradeCauldronSchema(): Promise<void> {
    const currentSchemaVersion = await this.getCauldronSchemaVersion()
    if (currentSchemaVersion === schemas.schemaVersion) {
      throw new Error(
        `The Cauldron is already using the proper schema version ${currentSchemaVersion}`
      )
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

  public async beginTransaction(): Promise<void> {
    await this.documentStore.beginTransaction()
    await this.fileStore.beginTransaction()
  }

  public async discardTransaction(): Promise<void> {
    await this.documentStore.discardTransaction()
    await this.fileStore.discardTransaction()
  }

  public async commitTransaction(message: string | string[]): Promise<void> {
    await this.documentStore.commitTransaction(message)
    await this.fileStore.commitTransaction(message)
  }

  // =====================================================================================
  // READ OPERATIONS
  // =====================================================================================

  public async getCauldronSchemaVersion(): Promise<string> {
    const cauldron = await this.getCauldron()
    return cauldron.schemaVersion || '0.0.0'
  }

  public async getElectrodeNativeVersion(): Promise<string | void> {
    const cauldron = await this.getCauldron()
    return cauldron.ernVersion
  }

  public async getDescriptor(
    descriptor: NativeApplicationDescriptor
  ): Promise<any> {
    if (descriptor.version) {
      return this.getVersion(descriptor)
    } else if (descriptor.platform) {
      return this.getPlatform(descriptor)
    } else {
      return this.getNativeApplication(descriptor)
    }
  }

  public async getNativeApplications(): Promise<CauldronNativeApp[]> {
    const cauldron = await this.getCauldron()
    return cauldron.nativeApps
  }

  public async hasDescriptor(
    descriptor: NativeApplicationDescriptor
  ): Promise<boolean> {
    if (descriptor.version) {
      return this.hasVersion(descriptor)
    } else if (descriptor.platform) {
      return this.hasPlatform(descriptor)
    } else {
      return this.hasNativeApplication(descriptor)
    }
  }

  public async hasNativeApplication(
    descriptor: NativeApplicationDescriptor
  ): Promise<boolean> {
    const cauldron = await this.getCauldron()
    const result = _.find(cauldron.nativeApps, n => n.name === descriptor.name)
    return result != null
  }

  public async hasPlatform(
    descriptor: NativeApplicationDescriptor
  ): Promise<boolean> {
    if (!(await this.hasNativeApplication(descriptor))) {
      return false
    }
    const platforms = await this.getPlatforms(descriptor)
    const result = _.find(platforms, p => p.name === descriptor.platform)
    return result != null
  }

  public async hasVersion(
    descriptor: NativeApplicationDescriptor
  ): Promise<boolean> {
    if (!(await this.hasPlatform(descriptor))) {
      return false
    }
    const versions = await this.getVersions(descriptor)
    const result = _.find(versions, v => v.name === descriptor.version)
    return result != null
  }

  public async getNativeApplication(
    descriptor: NativeApplicationDescriptor
  ): Promise<CauldronNativeApp> {
    const cauldron = await this.getCauldron()
    const result = _.find(cauldron.nativeApps, n => n.name === descriptor.name)
    if (!result) {
      throw new Error(`Cannot find ${descriptor.toString()} in Cauldron`)
    }
    return result
  }

  public async getPlatforms(
    descriptor: NativeApplicationDescriptor
  ): Promise<CauldronNativeAppPlatform[]> {
    const app = await this.getNativeApplication(descriptor)
    return app.platforms
  }

  public async getPlatform(
    descriptor: NativeApplicationDescriptor
  ): Promise<CauldronNativeAppPlatform> {
    const platforms = await this.getPlatforms(descriptor)
    const result = _.find(platforms, p => p.name === descriptor.platform)
    if (!result) {
      throw new Error(`Cannot find ${descriptor.toString()} in Cauldron`)
    }
    return result
  }

  public async getVersions(
    descriptor: NativeApplicationDescriptor
  ): Promise<CauldronNativeAppVersion[]> {
    const platform = await this.getPlatform(descriptor)
    return platform.versions
  }

  public async getVersion(
    descriptor: NativeApplicationDescriptor
  ): Promise<CauldronNativeAppVersion> {
    const versions = await this.getVersions(descriptor)
    const result = _.find(versions, v => v.name === descriptor.version)
    if (!result) {
      throw new Error(`Cannot find ${descriptor.toString()} in Cauldron`)
    }
    return result
  }

  public async getCodePushEntries(
    descriptor: NativeApplicationDescriptor,
    deploymentName: string
  ): Promise<CauldronCodePushEntry[]> {
    this.throwIfPartialNapDescriptor(descriptor)
    const version = await this.getVersion(descriptor)
    const result = version.codePush[deploymentName]
    return result
  }

  public async getContainerMiniApps(
    descriptor: NativeApplicationDescriptor
  ): Promise<string[]> {
    this.throwIfPartialNapDescriptor(descriptor)
    const version = await this.getVersion(descriptor)
    return version.container.miniApps
  }

  public async getContainerJsApiImpls(
    descriptor: NativeApplicationDescriptor
  ): Promise<string[]> {
    this.throwIfPartialNapDescriptor(descriptor)
    const version = await this.getVersion(descriptor)
    return version.container.jsApiImpls
  }

  public async getContainerJsApiImpl(
    descriptor: NativeApplicationDescriptor,
    jsApiImplName: string
  ): Promise<string> {
    const jsApiImpls = await this.getContainerJsApiImpls(descriptor)
    const result = _.find(
      jsApiImpls,
      x => x === jsApiImplName || x.startsWith(`${jsApiImplName}@`)
    )
    if (!result) {
      throw new Error(
        `Cannot find ${jsApiImplName} JS API implementation in ${descriptor.toString()} Container`
      )
    }
    return result
  }

  public async isMiniAppInContainer(
    descriptor: NativeApplicationDescriptor,
    miniAppName: string
  ): Promise<boolean> {
    this.throwIfPartialNapDescriptor(descriptor)
    const miniApps = await this.getContainerMiniApps(descriptor)
    const result = _.find(miniApps, m => m.startsWith(miniAppName))
    if (!result) {
      return false
    } else {
      return true
    }
  }

  public async getContainerMiniApp(
    descriptor: NativeApplicationDescriptor,
    miniAppName: string
  ): Promise<string> {
    this.throwIfPartialNapDescriptor(descriptor)
    const miniApps = await this.getContainerMiniApps(descriptor)
    const result = _.find(miniApps, m => m.startsWith(miniAppName))
    if (!result) {
      throw new Error(
        `Cannot find ${miniAppName} MiniApp in ${descriptor.toString()} Container`
      )
    }
    return result
  }

  public async getNativeDependencies(
    descriptor: NativeApplicationDescriptor
  ): Promise<string[]> {
    this.throwIfPartialNapDescriptor(descriptor)
    const version = await this.getVersion(descriptor)
    return version.container.nativeDeps
  }

  public async isNativeDependencyInContainer(
    descriptor: NativeApplicationDescriptor,
    nativeDepName: string
  ): Promise<boolean> {
    this.throwIfPartialNapDescriptor(descriptor)
    const nativeDeps = await this.getNativeDependencies(descriptor)
    const result = _.find(
      nativeDeps,
      x => x === nativeDepName || x.startsWith(`${nativeDepName}@`)
    )
    if (!result) {
      return false
    } else {
      return true
    }
  }

  public async getContainerNativeDependency(
    descriptor: NativeApplicationDescriptor,
    nativeDepName: string
  ): Promise<string> {
    this.throwIfPartialNapDescriptor(descriptor)
    const nativeDeps = await this.getNativeDependencies(descriptor)
    const result = _.find(
      nativeDeps,
      x => x === nativeDepName || x.startsWith(`${nativeDepName}@`)
    )
    if (!result) {
      throw new Error(
        `Cannot find ${nativeDepName} native dependency in ${descriptor.toString()} Container`
      )
    }
    return result
  }

  public async getConfig(
    descriptor?: NativeApplicationDescriptor
  ): Promise<any | void> {
    const configByLevel = await this.getConfigByLevel(descriptor)
    return (
      configByLevel.get(CauldronConfigLevel.NativeAppVersion) ||
      configByLevel.get(CauldronConfigLevel.NativeAppPlatform) ||
      configByLevel.get(CauldronConfigLevel.NativeApp) ||
      configByLevel.get(CauldronConfigLevel.Top)
    )
  }

  public async getConfigByLevel(
    descriptor?: NativeApplicationDescriptor
  ): Promise<Map<CauldronConfigLevel, any>> {
    const result = new Map()
    if (descriptor) {
      if (descriptor.platform) {
        if (descriptor.version) {
          const version = await this.getVersion(descriptor)
          if (version.config) {
            result.set(CauldronConfigLevel.NativeAppVersion, version.config)
          }
        }
        const platform = await this.getPlatform(descriptor)
        if (platform.config) {
          result.set(CauldronConfigLevel.NativeAppPlatform, platform.config)
        }
      }
      const app = await this.getNativeApplication(descriptor)
      if (app.config) {
        result.set(CauldronConfigLevel.NativeApp, app.config)
      }
    }
    const cauldron = await this.getCauldron()
    if (cauldron.config) {
      result.set(CauldronConfigLevel.Top, cauldron.config)
    }
    return result
  }

  // =====================================================================================
  // WRITE OPERATIONS
  // =====================================================================================

  public async clearCauldron(): Promise<void> {
    const cauldron = await this.getCauldron()
    cauldron.nativeApps = []
    return this.commit('Clear Cauldron')
  }

  public async setElectrodeNativeVersion(version?: string): Promise<void> {
    const cauldron = await this.getCauldron()
    if (!version) {
      delete cauldron.ernVersion
      return this.commit('Removed Electrode Native version enforcement')
    } else {
      cauldron.ernVersion = version
      return this.commit(
        `Update enforced Electrode Native Version to ${version}`
      )
    }
  }

  public async addDescriptor(
    descriptor: NativeApplicationDescriptor
  ): Promise<void> {
    if (!(await this.hasNativeApplication(descriptor))) {
      await this.createNativeApplication({ name: descriptor.name })
    }
    if (descriptor.platform && !(await this.hasPlatform(descriptor))) {
      await this.createPlatform(descriptor, { name: descriptor.platform })
    }
    if (descriptor.version && !(await this.hasVersion(descriptor))) {
      await this.createVersion(descriptor, { name: descriptor.version })
    }
  }

  public async removeDescriptor(
    descriptor: NativeApplicationDescriptor
  ): Promise<void> {
    if (descriptor.version) {
      return this.removeVersion(descriptor)
    } else if (descriptor.platform) {
      return this.removePlatform(descriptor)
    } else {
      return this.removeNativeApplication(descriptor)
    }
  }

  public async createNativeApplication(nativeApplication: any): Promise<void> {
    const cauldron = await this.getCauldron()
    if (exists(cauldron.nativeApps, nativeApplication.name)) {
      throw new Error(`${nativeApplication.name} already exists`)
    }
    const validatedNativeApplication = await joiValidate(
      nativeApplication,
      schemas.nativeApplication
    )
    cauldron.nativeApps.push(validatedNativeApplication)
    return this.commit(`Create ${nativeApplication.name} native application`)
  }

  public async removeNativeApplication(
    descriptor: NativeApplicationDescriptor
  ): Promise<void> {
    const cauldron = await this.getCauldron()
    if (!exists(cauldron.nativeApps, descriptor.name)) {
      throw new Error(`${descriptor.name} was not found in Cauldron`)
    }
    _.remove(cauldron.nativeApps, x => x.name === descriptor.name)
    return this.commit(`Remove ${descriptor.toString()}`)
  }

  public async createPlatform(
    descriptor: NativeApplicationDescriptor,
    platform: any
  ): Promise<void> {
    const nativeApplication = await this.getNativeApplication(descriptor)
    const platformName = platform.name
    if (exists(nativeApplication.platforms, platform.name)) {
      throw new Error(
        `${platformName} platform already exists for ${descriptor.toString()}`
      )
    }
    const validatedPlatform = await joiValidate(
      platform,
      schemas.nativeApplicationPlatform
    )
    nativeApplication.platforms.push(validatedPlatform)
    return this.commit(
      `Create ${platformName} platform for ${descriptor.toString()}`
    )
  }

  public async removePlatform(descriptor: NativeApplicationDescriptor) {
    const platform = descriptor.platform
    if (!platform) {
      throw new Error(
        'removePlatform: descriptor should include the platform to be removed'
      )
    }
    const nativeApplication = await this.getNativeApplication(descriptor)
    if (!exists(nativeApplication.platforms, platform)) {
      throw new Error(
        `${platform} platform does not exist for ${
          descriptor.name
        } native application`
      )
    }
    _.remove(nativeApplication.platforms, x => x.name === platform)
    return this.commit(`Remove ${descriptor.toString()}`)
  }

  public async createVersion(
    descriptor: NativeApplicationDescriptor,
    version: any
  ): Promise<void> {
    const platform = await this.getPlatform(descriptor)
    const versionName = version.name
    if (exists(platform.versions, versionName)) {
      throw new Error(
        `${versionName} version already exists for ${descriptor.toString()}`
      )
    }
    const validatedVersion = await joiValidate(
      version,
      schemas.nativeApplicationVersion
    )
    platform.versions.push(validatedVersion)
    return this.commit(
      `Create version ${versionName} for ${descriptor.toString()}`
    )
  }

  public async removeVersion(
    descriptor: NativeApplicationDescriptor
  ): Promise<void> {
    const versionName = descriptor.version
    if (!versionName) {
      throw new Error(
        'removeVersion: descriptor should include the version to be removed'
      )
    }
    const platform = await this.getPlatform(descriptor)
    if (!exists(platform.versions, versionName)) {
      throw new Error(
        `${versionName} version does not exist for ${descriptor.toString()}`
      )
    }
    _.remove(platform.versions, x => x.name === versionName)
    return this.commit(`Remove ${descriptor.toString()}`)
  }

  public async updateVersion(
    descriptor: NativeApplicationDescriptor,
    newVersion: any
  ): Promise<void> {
    this.throwIfPartialNapDescriptor(descriptor)
    const validatedVersion = await joiValidate(
      newVersion,
      schemas.nativeAplicationVersionPatch
    )
    const version = await this.getVersion(descriptor)
    if (validatedVersion.isReleased != null) {
      version.isReleased = validatedVersion.isReleased
      await this.commit(`Update release status of ${descriptor.toString()}`)
    }
  }

  public async removeContainerNativeDependency(
    descriptor: NativeApplicationDescriptor,
    dependency: string
  ): Promise<void> {
    this.throwIfPartialNapDescriptor(descriptor)
    const version = await this.getVersion(descriptor)
    if (
      !_.some(version.container.nativeDeps, x => x.startsWith(`${dependency}@`))
    ) {
      throw new Error(
        `${dependency} dependency does not exists in ${descriptor.toString()} Container`
      )
    }
    _.remove(version.container.nativeDeps, x => x.startsWith(`${dependency}@`))
    return this.commit(
      `Remove ${dependency} dependency from ${descriptor.toString()} Container`
    )
  }

  public async updateContainerNativeDependencyVersion(
    descriptor: NativeApplicationDescriptor,
    dependencyName: string,
    newVersion: string
  ): Promise<void> {
    this.throwIfPartialNapDescriptor(descriptor)
    const version = await this.getVersion(descriptor)
    if (
      !_.some(version.container.nativeDeps, x =>
        x.startsWith(`${dependencyName}@`)
      )
    ) {
      throw new Error(
        `${dependencyName} dependency does not exists in ${descriptor.toString()} Container`
      )
    }
    _.remove(version.container.nativeDeps, x =>
      x.startsWith(`${dependencyName}@`)
    )
    const newDependencyString = `${dependencyName}@${newVersion}`
    version.container.nativeDeps.push(newDependencyString)
    return this.commit(
      `Update ${dependencyName} dependency to v${newVersion} in ${descriptor.toString()} Container`
    )
  }

  public async updateContainerMiniAppVersion(
    descriptor: NativeApplicationDescriptor,
    miniApp: PackagePath
  ): Promise<void> {
    this.throwIfPartialNapDescriptor(descriptor)
    const version = await this.getVersion(descriptor)
    const miniAppInContainer = _.find(version.container.miniApps, m =>
      miniApp.same(PackagePath.fromString(m), { ignoreVersion: true })
    )
    if (!miniAppInContainer) {
      throw new Error(
        `${
          miniApp.basePath
        } does not exist in version ${descriptor.toString()} Container`
      )
    }
    version.container.miniApps = _.map(
      version.container.miniApps,
      e => (e === miniAppInContainer ? miniApp.toString() : e)
    )
    return this.commit(
      `Update version of ${miniApp.basePath} MiniApp to ${miniApp.version ||
        ''} in ${descriptor.toString()} Container`
    )
  }

  public async updateTopLevelContainerVersion(
    descriptor: NativeApplicationDescriptor,
    newContainerVersion: string
  ): Promise<void> {
    const platform = await this.getPlatform(descriptor)
    platform.config = platform.config || {}
    platform.config.containerGenerator =
      platform.config.containerGenerator || {}
    platform.config.containerGenerator.containerVersion = newContainerVersion
    return this.commit(
      `Update top level Container version of ${descriptor.toString()} to ${newContainerVersion}`
    )
  }

  public async updateContainerVersion(
    descriptor: NativeApplicationDescriptor,
    newContainerVersion: string
  ): Promise<void> {
    this.throwIfPartialNapDescriptor(descriptor)
    const version = await this.getVersion(descriptor)
    version.containerVersion = newContainerVersion
    return this.commit(
      `Update container version of ${descriptor.toString()} to ${newContainerVersion}`
    )
  }

  public async getTopLevelContainerVersion(
    descriptor: NativeApplicationDescriptor
  ): Promise<string | void> {
    const config = await this.getConfig(descriptor.withoutVersion())
    if (config && config.containerGenerator) {
      return config.containerGenerator.containerVersion
    }
  }

  public async getContainerVersion(
    descriptor: NativeApplicationDescriptor
  ): Promise<string> {
    this.throwIfPartialNapDescriptor(descriptor)
    const version = await this.getVersion(descriptor)
    return version.containerVersion
  }

  public async updateContainerErnVersion(
    descriptor: NativeApplicationDescriptor,
    ernVersion: string
  ) {
    this.throwIfPartialNapDescriptor(descriptor)
    const version = await this.getVersion(descriptor)
    version.container.ernVersion = ernVersion
    return this.commit(
      `Update version of ern used to generate Container of ${descriptor.toString()}`
    )
  }

  public async getContainerErnVersion(
    descriptor: NativeApplicationDescriptor
  ): Promise<string | void> {
    this.throwIfPartialNapDescriptor(descriptor)
    const version = await this.getVersion(descriptor)
    return version.container.ernVersion
  }

  public async removeContainerMiniApp(
    descriptor: NativeApplicationDescriptor,
    miniAppName: string
  ): Promise<void> {
    this.throwIfPartialNapDescriptor(descriptor)
    const version = await this.getVersion(descriptor)
    if (
      !_.some(version.container.miniApps, x => x.startsWith(`${miniAppName}@`))
    ) {
      throw new Error(
        `${miniAppName} MiniApp does not exist in ${descriptor.toString()} Container`
      )
    }
    _.remove(version.container.miniApps, x => x.startsWith(`${miniAppName}@`))
    return this.commit(
      `Remove ${miniAppName} MiniApp from ${descriptor.toString()} Container`
    )
  }

  public async removeContainerJsApiImpl(
    descriptor: NativeApplicationDescriptor,
    jsApiImplName: string
  ): Promise<void> {
    this.throwIfPartialNapDescriptor(descriptor)
    const version = await this.getVersion(descriptor)
    if (
      !_.some(
        version.container.jsApiImpls,
        x => x === jsApiImplName || x.startsWith(`${jsApiImplName}@`)
      )
    ) {
      throw new Error(
        `${jsApiImplName} JS API implementation does not exist in ${descriptor.toString()} Container`
      )
    }
    _.remove(
      version.container.jsApiImpls,
      x => x === jsApiImplName || x.startsWith(`${jsApiImplName}@`)
    )
    return this.commit(
      `Remove ${jsApiImplName} JS API implementation from ${descriptor.toString()} Container`
    )
  }

  public async updateContainerJsApiImplVersion(
    descriptor: NativeApplicationDescriptor,
    jsApiImplName: string,
    newVersion: string
  ): Promise<void> {
    this.throwIfPartialNapDescriptor(descriptor)
    const version = await this.getVersion(descriptor)
    if (
      !_.some(version.container.jsApiImpls, x =>
        x.startsWith(`${jsApiImplName}@`)
      )
    ) {
      throw new Error(
        `${jsApiImplName} JS API implementation does not exists in ${descriptor.toString()} Container`
      )
    }
    _.remove(version.container.jsApiImpls, x =>
      x.startsWith(`${jsApiImplName}@`)
    )
    const newJsApiImplString = `${jsApiImplName}@${newVersion}`
    version.container.jsApiImpls.push(newJsApiImplString)
    return this.commit(
      `Update ${jsApiImplName} JS API implementation to v${newVersion} in ${descriptor.toString()} Container`
    )
  }

  public async addContainerNativeDependency(
    descriptor: NativeApplicationDescriptor,
    dependency: PackagePath
  ): Promise<void> {
    this.throwIfPartialNapDescriptor(descriptor)
    const version = await this.getVersion(descriptor)
    if (version.container.nativeDeps.includes(dependency.toString())) {
      throw new Error(
        `${
          dependency.basePath
        } already exists in ${descriptor.toString()} Container`
      )
    }
    version.container.nativeDeps.push(dependency.toString())
    return this.commit(
      `Add native dependency ${dependency.toString()} in ${descriptor.toString()} Container`
    )
  }

  public async addContainerJsApiImpl(
    descriptor: NativeApplicationDescriptor,
    jsApiImpl: PackagePath
  ): Promise<void> {
    this.throwIfPartialNapDescriptor(descriptor)
    const version = await this.getVersion(descriptor)
    if (version.container.jsApiImpls.includes(jsApiImpl.toString())) {
      throw new Error(
        `${
          jsApiImpl.basePath
        } already exists in ${descriptor.toString()} Container`
      )
    }
    version.container.jsApiImpls.push(jsApiImpl.toString())
    return this.commit(
      `Add JS API implementation ${jsApiImpl.toString()} in ${descriptor.toString()} Container`
    )
  }

  public async hasCodePushEntries(
    descriptor: NativeApplicationDescriptor,
    deploymentName: string
  ): Promise<boolean> {
    const version = await this.getVersion(descriptor)
    return version.codePush[deploymentName] != null
  }

  public async addCodePushEntry(
    descriptor: NativeApplicationDescriptor,
    codePushEntry: CauldronCodePushEntry
  ): Promise<void> {
    const version = await this.getVersion(descriptor)
    const deploymentName = codePushEntry.metadata.deploymentName
    version.codePush[deploymentName]
      ? version.codePush[deploymentName].push(codePushEntry)
      : (version.codePush[deploymentName] = [codePushEntry])
    return this.commit(`New CodePush OTA update for ${descriptor.toString()}`)
  }

  public async setCodePushEntries(
    descriptor: NativeApplicationDescriptor,
    deploymentName: string,
    codePushEntries: CauldronCodePushEntry[]
  ): Promise<void> {
    this.throwIfPartialNapDescriptor(descriptor)
    const version = await this.getVersion(descriptor)
    version.codePush[deploymentName] = codePushEntries
    return this.commit(`Set codePush entries in ${descriptor.toString()}`)
  }

  public async addContainerMiniApp(
    descriptor: NativeApplicationDescriptor,
    miniapp: PackagePath
  ): Promise<void> {
    this.throwIfPartialNapDescriptor(descriptor)
    const version = await this.getVersion(descriptor)
    if (version.container.miniApps.includes(miniapp.toString())) {
      throw new Error(
        `${
          miniapp.basePath
        } MiniApp already exists in ${descriptor.toString()} Container`
      )
    }
    version.container.miniApps.push(miniapp.toString())
    return this.commit(
      `Add ${miniapp.basePath} MiniApp in ${descriptor.toString()} Container`
    )
  }

  // =====================================================================================
  // FILE OPERATIONS
  // =====================================================================================

  // -------------------------------------------------------------------------------------
  // ARBITRARY FILE ACCESS
  // -------------------------------------------------------------------------------------

  public async addFile({
    cauldronFilePath,
    fileContent,
    fileMode,
  }: {
    cauldronFilePath: string
    fileContent: string | Buffer
    fileMode?: string
  }) {
    if (!cauldronFilePath) {
      throw new Error('[addFile] cauldronFilePath is required')
    }
    if (!fileContent) {
      throw new Error('[addFile] fileContent is required')
    }
    cauldronFilePath = normalizeCauldronFilePath(cauldronFilePath)
    if (await this.hasFile({ cauldronFilePath })) {
      throw new Error(
        `[addFile] ${cauldronFilePath} already exists. Use updateFile instead.`
      )
    }
    return this.fileStore.storeFile(cauldronFilePath, fileContent, fileMode)
  }

  public async updateFile({
    cauldronFilePath,
    fileContent,
    fileMode,
  }: {
    cauldronFilePath: string
    fileContent: string | Buffer
    fileMode?: string
  }) {
    if (!cauldronFilePath) {
      throw new Error('[updateFile] cauldronFilePath is required')
    }
    if (!fileContent) {
      throw new Error('[updateFile] fileContent is required')
    }
    cauldronFilePath = normalizeCauldronFilePath(cauldronFilePath)
    if (!(await this.hasFile({ cauldronFilePath }))) {
      throw new Error(
        `[updateFile] ${cauldronFilePath} does not exist. Use addFile first.`
      )
    }
    return this.fileStore.storeFile(cauldronFilePath, fileContent, fileMode)
  }

  public async removeFile({ cauldronFilePath }: { cauldronFilePath: string }) {
    if (!cauldronFilePath) {
      throw new Error('[removeFile] cauldronFilePath is required')
    }
    cauldronFilePath = normalizeCauldronFilePath(cauldronFilePath)
    if (!(await this.hasFile({ cauldronFilePath }))) {
      throw new Error(`[removeFile] ${cauldronFilePath} does not exist`)
    }
    return this.fileStore.removeFile(cauldronFilePath)
  }

  public async hasFile({ cauldronFilePath }: { cauldronFilePath: string }) {
    cauldronFilePath = normalizeCauldronFilePath(cauldronFilePath)
    return this.fileStore.hasFile(cauldronFilePath)
  }

  public async getFile({
    cauldronFilePath,
  }: {
    cauldronFilePath: string
  }): Promise<Buffer> {
    if (!cauldronFilePath) {
      throw new Error('[removeFile] cauldronFilePath is required')
    }
    cauldronFilePath = normalizeCauldronFilePath(cauldronFilePath)
    if (!(await this.hasFile({ cauldronFilePath }))) {
      throw new Error(`[getFile] ${cauldronFilePath} does not exist.`)
    }
    const result = await this.fileStore.getFile(cauldronFilePath)
    return result as Buffer
  }

  // -------------------------------------------------------------------------------------
  // YARN LOCKS STORE ACCESS
  // -------------------------------------------------------------------------------------

  /**
   * Gets the relative path (from the root of the Cauldron repo) to
   * a given yarn lock file
   * @param yarnLockFileName Yarn lock file name
   */
  public getRelativePathToYarnLock(yarnLockFileName: string): string {
    return path.join(yarnLocksStoreDirectory, yarnLockFileName)
  }

  public async hasYarnLock(
    descriptor: NativeApplicationDescriptor,
    key: string
  ): Promise<boolean> {
    this.throwIfPartialNapDescriptor(descriptor)
    const version = await this.getVersion(descriptor)
    if (version.yarnLocks[key]) {
      return true
    } else {
      return false
    }
  }

  public async addYarnLock(
    descriptor: NativeApplicationDescriptor,
    key: string,
    yarnlock: string | Buffer
  ): Promise<void> {
    this.throwIfPartialNapDescriptor(descriptor)
    const version = await this.getVersion(descriptor)
    const fileName = shasum(yarnlock)
    const pathToYarnLock = this.getRelativePathToYarnLock(fileName)
    await this.fileStore.storeFile(pathToYarnLock, yarnlock)
    version.yarnLocks[key] = fileName
    return this.commit(`Add yarn.lock for ${descriptor.toString()} ${key}`)
  }

  public async getYarnLockId(
    descriptor: NativeApplicationDescriptor,
    key: string
  ): Promise<string | void> {
    this.throwIfPartialNapDescriptor(descriptor)
    const version = await this.getVersion(descriptor)
    return version.yarnLocks[key]
  }

  public async setYarnLockId(
    descriptor: NativeApplicationDescriptor,
    key: string,
    id: string
  ): Promise<void> {
    this.throwIfPartialNapDescriptor(descriptor)
    const version = await this.getVersion(descriptor)
    version.yarnLocks[key] = id
    return this.commit(`Add yarn.lock for ${descriptor.toString()} ${key}`)
  }

  public async getYarnLock(
    descriptor: NativeApplicationDescriptor,
    key: string
  ): Promise<Buffer | void> {
    this.throwIfPartialNapDescriptor(descriptor)
    const version = await this.getVersion(descriptor)
    const fileName = version.yarnLocks[key]
    if (fileName) {
      const pathToYarnLock = this.getRelativePathToYarnLock(fileName)
      return this.fileStore.getFile(pathToYarnLock)
    }
  }

  public async getPathToYarnLock(
    descriptor: NativeApplicationDescriptor,
    key: string
  ): Promise<string | void> {
    this.throwIfPartialNapDescriptor(descriptor)
    const version = await this.getVersion(descriptor)
    const fileName = version.yarnLocks[key]
    if (fileName) {
      const pathToYarnLock = this.getRelativePathToYarnLock(fileName)
      return this.fileStore.getPathToFile(pathToYarnLock)
    }
  }

  public async removeYarnLock(
    descriptor: NativeApplicationDescriptor,
    key: string
  ): Promise<boolean> {
    this.throwIfPartialNapDescriptor(descriptor)
    const version = await this.getVersion(descriptor)
    const fileName = version.yarnLocks[key]
    if (fileName) {
      const pathToYarnLock = this.getRelativePathToYarnLock(fileName)
      if (await this.fileStore.removeFile(pathToYarnLock)) {
        delete version.yarnLocks[key]
        await this.commit(
          `Remove yarn.lock for ${descriptor.toString()} ${key}`
        )
        return true
      }
    }
    return false
  }

  public async updateYarnLock(
    descriptor: NativeApplicationDescriptor,
    key: string,
    yarnlock: string | Buffer
  ): Promise<boolean> {
    this.throwIfPartialNapDescriptor(descriptor)
    const version = await this.getVersion(descriptor)
    const fileName = version.yarnLocks[key]
    if (fileName) {
      const pathToOldYarnLock = this.getRelativePathToYarnLock(fileName)
      await this.fileStore.removeFile(pathToOldYarnLock)
      const newYarnLockFileName = shasum(yarnlock)
      const pathToNewYarnLock = this.getRelativePathToYarnLock(
        newYarnLockFileName
      )
      await this.fileStore.storeFile(pathToNewYarnLock, yarnlock)
      version.yarnLocks[key] = newYarnLockFileName
      await this.commit(`Updated yarn.lock for ${descriptor.toString()} ${key}`)
      return true
    }
    return false
  }

  public async updateYarnLockId(
    descriptor: NativeApplicationDescriptor,
    key: string,
    id: string
  ) {
    this.throwIfPartialNapDescriptor(descriptor)
    const version = await this.getVersion(descriptor)
    const fileName = version.yarnLocks[key]
    if (fileName) {
      const pathToYarnLock = this.getRelativePathToYarnLock(fileName)
      await this.fileStore.removeFile(pathToYarnLock)
    }
    version.yarnLocks[key] = id
    await this.commit(
      `Updated yarn.lock id for ${descriptor.toString()} ${key}`
    )
  }

  public async setYarnLocks(
    descriptor: NativeApplicationDescriptor,
    yarnLocks: any
  ) {
    this.throwIfPartialNapDescriptor(descriptor)
    const version = await this.getVersion(descriptor)
    version.yarnLocks = yarnLocks
    await this.commit(`Set yarn locks for ${descriptor.toString()}`)
  }

  // -------------------------------------------------------------------------------------
  // BUNDLES STORE ACCESS
  // -------------------------------------------------------------------------------------

  /**
   * Gets the relative path (from the root of the Cauldron repo) to
   * a given bundle file
   * @param bundleFileName Bundle file name
   */
  public getRelativePathToBundle(bundleFileName: string): string {
    return path.join(bundlesStoreDirectory, bundleFileName)
  }

  public async addBundle(
    descriptor: NativeApplicationDescriptor,
    bundle: string | Buffer
  ) {
    this.throwIfPartialNapDescriptor(descriptor)
    const filename = this.getBundleZipFileName(descriptor)
    const pathToBundle = this.getRelativePathToBundle(filename)
    await this.fileStore.storeFile(pathToBundle, bundle)
    return this.commit(`Add bundle for ${descriptor.toString()}`)
  }

  public async hasBundle(
    descriptor: NativeApplicationDescriptor
  ): Promise<boolean> {
    this.throwIfPartialNapDescriptor(descriptor)
    const filename = this.getBundleZipFileName(descriptor)
    const pathToBundle = this.getRelativePathToBundle(filename)
    return this.fileStore.hasFile(pathToBundle)
  }

  public async getBundle(
    descriptor: NativeApplicationDescriptor
  ): Promise<Buffer> {
    this.throwIfPartialNapDescriptor(descriptor)
    const filename = this.getBundleZipFileName(descriptor)
    const pathToBundle = this.getRelativePathToBundle(filename)
    const zippedBundle = await this.fileStore.getFile(pathToBundle)
    if (!zippedBundle) {
      throw new Error(
        `No zipped bundle stored in Cauldron for ${descriptor.toString()}`
      )
    }
    return zippedBundle
  }

  public getBundleZipFileName(descriptor: NativeApplicationDescriptor): string {
    this.throwIfPartialNapDescriptor(descriptor)
    return `${descriptor.toString()}.zip`
  }

  public async addPublisher(
    publisher: string,
    descriptor: NativeApplicationDescriptor,
    url?: string,
    extra?: any
  ) {
    try {
      const platform = await this.getPlatform(descriptor)
      platform.config = platform.config || {}
      platform.config.containerGenerator =
        platform.config.containerGenerator || {}
      platform.config.containerGenerator.publishers =
        platform.config.containerGenerator.publishers || []
      for (const p of platform.config.containerGenerator.publishers) {
        if (p.name === publisher) {
          throw new Error(
            `${publisher} publisher already exists for ${descriptor.toString()}. 
If you want to modify this publisher configuration you need to edit it manually in your Cauldron.`
          )
        }
      }
      platform.config.containerGenerator.publishers.push({
        extra,
        name: publisher,
        url,
      })
      await this.commit(
        `Add ${publisher} publisher for ${descriptor.toString()}`
      )
    } catch (e) {
      throw new Error(`[cauldronApi] addPublisher: ${e}`)
    }
  }

  public throwIfPartialNapDescriptor(
    napDescriptor: NativeApplicationDescriptor
  ) {
    if (napDescriptor.isPartial) {
      throw new Error(
        `Cannot work with a partial native application descriptor`
      )
    }
  }
}
