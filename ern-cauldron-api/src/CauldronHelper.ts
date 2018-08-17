import _ from 'lodash'
import {
  log,
  PackagePath,
  NativeApplicationDescriptor,
  fileUtils,
  promptUtils,
} from 'ern-core'
import {
  CauldronCodePushMetadata,
  CauldronCodePushEntry,
  CauldronConfigLevel,
} from './types'
import CauldronApi from './CauldronApi'
import semver from 'semver'

//
// Helper class to access the cauldron
// It uses the ern-cauldron-cli client
export class CauldronHelper {
  private readonly cauldron: CauldronApi

  constructor(cauldronApi: CauldronApi) {
    if (!cauldronApi) {
      throw new Error('cauldronApi is required')
    }
    this.cauldron = cauldronApi
  }

  public async beginTransaction(): Promise<void> {
    return this.cauldron.beginTransaction()
  }

  public async discardTransaction(): Promise<void> {
    return this.cauldron.discardTransaction()
  }

  public async commitTransaction(message: string | string[]): Promise<void> {
    return this.cauldron.commitTransaction(message)
  }

  public async getCauldronSchemaVersion(): Promise<string> {
    return this.cauldron.getCauldronSchemaVersion()
  }

  public async upgradeCauldronSchema(): Promise<void> {
    return this.cauldron.upgradeCauldronSchema()
  }

  public async getElectrodeNativeVersion(): Promise<string | void> {
    return this.cauldron.getElectrodeNativeVersion()
  }

  public async setElectrodeNativeVersion(version?: string): Promise<void> {
    return this.cauldron.setElectrodeNativeVersion(version)
  }

  public async isDescriptorInCauldron(
    napDescriptor: NativeApplicationDescriptor
  ): Promise<boolean> {
    return this.cauldron.hasDescriptor(napDescriptor)
  }

  public async addDescriptor(napDescriptor: NativeApplicationDescriptor) {
    return this.cauldron.addDescriptor(napDescriptor)
  }

  public async removeDescriptor(napDescriptor: NativeApplicationDescriptor) {
    return this.cauldron.removeDescriptor(napDescriptor)
  }

  public async addContainerNativeDependency(
    napDescriptor: NativeApplicationDescriptor,
    dependency: PackagePath
  ): Promise<void> {
    await this.throwIfNativeAppVersionIsReleased(
      napDescriptor,
      'Cannot add a native dependency to a released native app version'
    )
    return this.cauldron.addContainerNativeDependency(napDescriptor, dependency)
  }

  public async removeContainerNativeDependency(
    napDescriptor: NativeApplicationDescriptor,
    dependency: PackagePath
  ): Promise<void> {
    await this.throwIfNativeAppVersionIsReleased(
      napDescriptor,
      'Cannot remove a native dependency from a released native app version'
    )
    return this.cauldron.removeContainerNativeDependency(
      napDescriptor,
      dependency.basePath
    )
  }

  public async removeContainerMiniApp(
    napDescriptor: NativeApplicationDescriptor,
    miniAppName: PackagePath
  ): Promise<void> {
    await this.throwIfNativeAppVersionIsReleased(
      napDescriptor,
      'Cannot remove a MiniApp for a released native app version'
    )
    return this.cauldron.removeContainerMiniApp(
      napDescriptor,
      miniAppName.basePath
    )
  }

  public async removeContainerJsApiImpl(
    napDescriptor: NativeApplicationDescriptor,
    jsApiImpl: PackagePath
  ): Promise<void> {
    await this.throwIfNativeAppVersionIsReleased(
      napDescriptor,
      'Cannot remove a JS API impl from the Container of a released native app version'
    )
    return this.cauldron.removeContainerJsApiImpl(
      napDescriptor,
      jsApiImpl.basePath
    )
  }

  public async addPublisher(
    publisher: string,
    supportedPlatforms: string[],
    napDescriptor?: NativeApplicationDescriptor,
    url?: string,
    extra?: any
  ): Promise<void> {
    let nativeAppName
    let platform
    if (napDescriptor) {
      nativeAppName = napDescriptor.name
      platform = napDescriptor.platform
    } else {
      platform = await promptUtils.askUserToChooseAnOption(
        supportedPlatforms,
        'Choose a platform to add this publisher'
      )

      const nativeApps: string[] = await this.getNativeAppsForPlatform(platform)
      if (nativeApps && nativeApps.length > 0) {
        nativeAppName =
          nativeApps.length === 1
            ? nativeApps[0]
            : await promptUtils.askUserToChooseAnOption(
                nativeApps,
                'Choose an application to add this publisher'
              )
      } else {
        throw new Error(
          `Looks like there are no application defined in cauldron for ${platform}`
        )
      }
    }
    log.info('Adding publisher to native app')
    await this.cauldron.addPublisher(
      publisher,
      new NativeApplicationDescriptor(nativeAppName, platform),
      url,
      extra
    )
  }

  public async getNativeAppsForPlatform(
    platformName: string
  ): Promise<string[]> {
    const availableNativeApps = await this.getAllNativeApps()
    const result: string[] = []
    if (availableNativeApps) {
      for (const nativeApp of availableNativeApps) {
        for (const platform of nativeApp.platforms) {
          if (platform.name === platformName) {
            result.push(nativeApp.name)
          }
        }
      }
    }
    return result
  }

  public async getDescriptor(
    napDescriptor: NativeApplicationDescriptor
  ): Promise<any> {
    return this.cauldron.getDescriptor(napDescriptor)
  }

  public async getVersions(
    napDescriptor: NativeApplicationDescriptor
  ): Promise<any> {
    if (!napDescriptor.platform) {
      throw new Error(
        `[getVersions] platform must be present in the NativeApplicationDesctiptor`
      )
    }
    return this.cauldron.getVersions(napDescriptor)
  }

  public async getVersionsNames(
    napDescriptor: NativeApplicationDescriptor
  ): Promise<string[]> {
    const versions = await this.getVersions(napDescriptor)
    return _.map(versions, v => v.name)
  }

  public async getNativeDependencies(
    napDescriptor: NativeApplicationDescriptor
  ): Promise<PackagePath[]> {
    const dependencies = await this.cauldron.getNativeDependencies(
      napDescriptor
    )
    return _.map(dependencies, PackagePath.fromString)
  }

  public async addFile({
    localFilePath,
    cauldronFilePath,
  }: {
    localFilePath: string
    cauldronFilePath: string
  }) {
    const fileContent = await fileUtils.readFile(localFilePath)
    const isExecutable = await fileUtils.isExecutable(localFilePath)
    return this.cauldron.addFile({
      cauldronFilePath,
      fileContent,
      fileMode: isExecutable ? '+x' : undefined,
    })
  }

  public async updateFile({
    localFilePath,
    cauldronFilePath,
  }: {
    localFilePath: string
    cauldronFilePath: string
  }) {
    const fileContent = await fileUtils.readFile(localFilePath)
    const isExecutable = await fileUtils.isExecutable(localFilePath)
    return this.cauldron.updateFile({
      cauldronFilePath,
      fileContent,
      fileMode: isExecutable ? '+x' : undefined,
    })
  }

  public async removeFile({ cauldronFilePath }: { cauldronFilePath: string }) {
    return this.cauldron.removeFile({ cauldronFilePath })
  }

  public async hasFile({ cauldronFilePath }: { cauldronFilePath: string }) {
    return this.cauldron.hasFile({ cauldronFilePath })
  }

  public async getFile({
    cauldronFilePath,
  }: {
    cauldronFilePath: string
  }): Promise<Buffer> {
    return this.cauldron.getFile({ cauldronFilePath })
  }

  public async hasYarnLock(
    napDescriptor: NativeApplicationDescriptor,
    key: string
  ): Promise<boolean> {
    return this.cauldron.hasYarnLock(napDescriptor, key)
  }

  public async addYarnLock(
    napDescriptor: NativeApplicationDescriptor,
    key: string,
    yarnlockPath: string
  ): Promise<void> {
    const yarnLockFile = await fileUtils.readFile(yarnlockPath)
    return this.cauldron.addYarnLock(napDescriptor, key, yarnLockFile)
  }

  public async getYarnLock(
    napDescriptor: NativeApplicationDescriptor,
    key: string
  ): Promise<Buffer | void> {
    return this.cauldron.getYarnLock(napDescriptor, key)
  }

  public async getPathToYarnLock(
    napDescriptor: NativeApplicationDescriptor,
    key: string
  ): Promise<string | void> {
    return this.cauldron.getPathToYarnLock(napDescriptor, key)
  }

  public async removeYarnLock(
    napDescriptor: NativeApplicationDescriptor,
    key: string
  ): Promise<boolean> {
    return this.cauldron.removeYarnLock(napDescriptor, key)
  }

  public async updateYarnLock(
    napDescriptor: NativeApplicationDescriptor,
    key: string,
    yarnlockPath: string
  ): Promise<boolean> {
    const yarnLockFile = await fileUtils.readFile(yarnlockPath)
    return this.cauldron.updateYarnLock(napDescriptor, key, yarnLockFile)
  }

  public async setYarnLocks(
    napDescriptor: NativeApplicationDescriptor,
    yarnLocks: any
  ): Promise<void> {
    return this.cauldron.setYarnLocks(napDescriptor, yarnLocks)
  }

  public async addOrUpdateYarnLock(
    napDescriptor: NativeApplicationDescriptor,
    key: string,
    yarnlockPath: string
  ): Promise<any> {
    if (await this.hasYarnLock(napDescriptor, key)) {
      return this.updateYarnLock(napDescriptor, key, yarnlockPath)
    } else {
      return this.addYarnLock(napDescriptor, key, yarnlockPath)
    }
  }

  public async getYarnLockId(
    napDescriptor: NativeApplicationDescriptor,
    key: string
  ): Promise<string | void> {
    return this.cauldron.getYarnLockId(napDescriptor, key)
  }

  public async setYarnLockId(
    napDescriptor: NativeApplicationDescriptor,
    key: string,
    id: string
  ): Promise<void> {
    return this.cauldron.setYarnLockId(napDescriptor, key, id)
  }

  public async updateYarnLockId(
    napDescriptor: NativeApplicationDescriptor,
    key: string,
    id: string
  ): Promise<void> {
    return this.cauldron.updateYarnLockId(napDescriptor, key, id)
  }

  public async addBundle(
    napDescriptor: NativeApplicationDescriptor,
    bundle: string | Buffer
  ): Promise<void> {
    return this.cauldron.addBundle(napDescriptor, bundle)
  }

  public async hasBundle(
    napDescriptor: NativeApplicationDescriptor
  ): Promise<boolean> {
    return this.cauldron.hasBundle(napDescriptor)
  }

  public async getBundle(
    napDescriptor: NativeApplicationDescriptor
  ): Promise<Buffer> {
    return this.cauldron.getBundle(napDescriptor)
  }

  public async isNativeDependencyInContainer(
    napDescriptor: NativeApplicationDescriptor,
    dependencyName: string
  ): Promise<boolean> {
    return this.cauldron.isNativeDependencyInContainer(
      napDescriptor,
      dependencyName
    )
  }

  public async getContainerNativeDependency(
    napDescriptor: NativeApplicationDescriptor,
    dependencyName: string
  ): Promise<PackagePath> {
    const dependency = await this.cauldron.getContainerNativeDependency(
      napDescriptor,
      dependencyName
    )
    return PackagePath.fromString(dependency)
  }

  public async updateContainerNativeDependencyVersion(
    napDescriptor: NativeApplicationDescriptor,
    dependencyName: string,
    newVersion: string
  ): Promise<void> {
    await this.throwIfNativeAppVersionIsReleased(
      napDescriptor,
      'Cannot update a native dependency for a released native app version'
    )
    return this.cauldron.updateContainerNativeDependencyVersion(
      napDescriptor,
      dependencyName,
      newVersion
    )
  }

  public async syncContainerMiniApps(
    napDescriptor: NativeApplicationDescriptor,
    miniappsPackagePath: PackagePath[]
  ): Promise<void> {
    const cauldronMiniApps = await this.getContainerMiniApps(napDescriptor)
    // Add MiniApps that are not part of the Container
    const newMiniApps = _.differenceBy(
      miniappsPackagePath,
      cauldronMiniApps,
      'basePath'
    )
    for (const newMiniApp of newMiniApps) {
      await this.addContainerMiniApp(napDescriptor, newMiniApp)
    }
    // Update MiniApps that have a different version
    for (const cauldronMiniApp of cauldronMiniApps) {
      const miniapp = _.find(
        miniappsPackagePath,
        d => d.basePath === cauldronMiniApp.basePath
      )
      if (miniapp && miniapp.version !== cauldronMiniApp.version) {
        await this.updateContainerMiniAppVersion(napDescriptor, miniapp)
      }
    }
  }

  public async syncContainerJsApiImpls(
    napDescriptor: NativeApplicationDescriptor,
    jsApiImplsPackagePath: PackagePath[]
  ): Promise<void> {
    const cauldronJsApiImpls = await this.getContainerJsApiImpls(napDescriptor)
    // Add JS API Impls that are not part of the Container
    const newJsApiImpls = _.differenceBy(
      jsApiImplsPackagePath,
      cauldronJsApiImpls,
      'basePath'
    )
    for (const newJsApiImpl of newJsApiImpls) {
      await this.addContainerJsApiImpl(napDescriptor, newJsApiImpl)
    }
    // Update JS API Impls that have a different version
    for (const cauldronJsApiImpl of cauldronJsApiImpls) {
      const jsApiImpl = _.find(
        jsApiImplsPackagePath,
        d => d.basePath === cauldronJsApiImpl.basePath
      )
      if (
        jsApiImpl &&
        jsApiImpl.version &&
        jsApiImpl.version !== cauldronJsApiImpl.version
      ) {
        await this.updateContainerJsApiImplVersion(
          napDescriptor,
          jsApiImpl.basePath,
          jsApiImpl.version
        )
      }
    }
  }

  public async syncContainerNativeDependencies(
    napDescriptor: NativeApplicationDescriptor,
    nativeDependencies: PackagePath[]
  ): Promise<void> {
    const cauldronNativeDependencies = await this.getNativeDependencies(
      napDescriptor
    )
    // Add native dependencies that are not part of the Container
    const newNativeDependencies = _.differenceBy(
      nativeDependencies,
      cauldronNativeDependencies,
      'basePath'
    )
    for (const newNativeDependency of newNativeDependencies) {
      await this.addContainerNativeDependency(
        napDescriptor,
        newNativeDependency
      )
    }
    // Update native dependencies that have a different version
    for (const cauldronNativeDependency of cauldronNativeDependencies) {
      const dep = _.find(
        nativeDependencies,
        d => d.basePath === cauldronNativeDependency.basePath
      )
      if (
        dep &&
        dep.version &&
        dep.version !== cauldronNativeDependency.version
      ) {
        await this.updateContainerNativeDependencyVersion(
          napDescriptor,
          dep.basePath,
          dep.version
        )
      }
    }
  }

  public async updateContainerJsApiImplVersion(
    napDescriptor: NativeApplicationDescriptor,
    jsApiImplName: string,
    newVersion: string
  ): Promise<void> {
    await this.throwIfNativeAppVersionIsReleased(
      napDescriptor,
      'Cannot update a JS API implementation in the Container of a released native app version'
    )
    return this.cauldron.updateContainerJsApiImplVersion(
      napDescriptor,
      jsApiImplName,
      newVersion
    )
  }

  public async getAllNativeApps(): Promise<any> {
    return this.cauldron.getNativeApplications()
  }

  public async getContainerJsApiImpls(
    napDescriptor: NativeApplicationDescriptor
  ): Promise<PackagePath[]> {
    const jsApiImpls = await this.cauldron.getContainerJsApiImpls(napDescriptor)
    return _.map(jsApiImpls, j => PackagePath.fromString(j))
  }

  public async getContainerJsApiImpl(
    napDescriptor: NativeApplicationDescriptor,
    jsApiImpl: PackagePath
  ): Promise<string> {
    return this.cauldron.getContainerJsApiImpl(
      napDescriptor,
      jsApiImpl.toString()
    )
  }

  public async getCodePushJsApiImpls(
    napDescriptor: NativeApplicationDescriptor,
    deploymentName: string,
    {
      label,
    }: {
      label?: string
    } = {}
  ): Promise<PackagePath[] | void> {
    const codePushEntry = await this.getCodePushEntry(
      napDescriptor,
      deploymentName,
      { label }
    )
    if (codePushEntry) {
      return _.map(codePushEntry.jsApiImpls, e => PackagePath.fromString(e))
    }
  }

  public async isMiniAppInContainer(
    napDescriptor: NativeApplicationDescriptor,
    miniApp: any
  ): Promise<boolean> {
    return this.cauldron.isMiniAppInContainer(napDescriptor, miniApp.toString())
  }

  public async getContainerMiniApp(
    napDescriptor: NativeApplicationDescriptor,
    miniApp: any
  ): Promise<string> {
    return this.cauldron.getContainerMiniApp(napDescriptor, miniApp.toString())
  }

  public async getCodePushMiniApps(
    napDescriptor: NativeApplicationDescriptor,
    deploymentName: string,
    {
      label,
    }: {
      label?: string
    } = {}
  ): Promise<PackagePath[] | void> {
    const codePushEntry = await this.getCodePushEntry(
      napDescriptor,
      deploymentName,
      { label }
    )
    if (codePushEntry) {
      return _.map(codePushEntry.miniapps, e => PackagePath.fromString(e))
    }
  }

  public async getCodePushEntry(
    napDescriptor: NativeApplicationDescriptor,
    deploymentName: string,
    {
      label,
    }: {
      label?: string
    } = {}
  ): Promise<CauldronCodePushEntry | void> {
    const codePushEntries = await this.cauldron.getCodePushEntries(
      napDescriptor,
      deploymentName
    )
    let result
    if (codePushEntries) {
      if (label) {
        result = _.find(codePushEntries, e => e.metadata.label === label)
        if (!result || result.length === 0) {
          throw new Error(
            `No CodePush entry matching label ${label} was found in ${napDescriptor.toString()}`
          )
        }
      } else {
        result = _.last(codePushEntries)
      }
    }
    return result
  }

  public async getContainerMiniApps(
    napDescriptor: NativeApplicationDescriptor
  ): Promise<PackagePath[]> {
    try {
      const miniApps = await this.cauldron.getContainerMiniApps(napDescriptor)
      return _.map(miniApps, PackagePath.fromString)
    } catch (e) {
      log.error(`[getContainerMiniApps] ${e}`)
      throw e
    }
  }

  public async addCodePushEntry(
    napDescriptor: NativeApplicationDescriptor,
    metadata: CauldronCodePushMetadata,
    miniApps: PackagePath[],
    jsApiImplementations: PackagePath[]
  ): Promise<void> {
    const miniapps = _.map(miniApps, x => x.toString())
    const jsApiImpls = _.map(jsApiImplementations, x => x.toString())
    const codePushConfig = await this.getCodePushConfig()
    let codePushEntries
    if (
      await this.cauldron.hasCodePushEntries(
        napDescriptor,
        metadata.deploymentName
      )
    ) {
      codePushEntries = await this.cauldron.getCodePushEntries(
        napDescriptor,
        metadata.deploymentName
      )
    }
    let nbEntriesToDrop = 0
    let updatedEntriesArr

    if (codePushEntries) {
      if (
        codePushConfig &&
        codePushConfig.entriesLimit &&
        codePushEntries.length >= codePushConfig.entriesLimit
      ) {
        nbEntriesToDrop =
          codePushEntries.length - codePushConfig.entriesLimit + 1
      }
      updatedEntriesArr = _.drop(codePushEntries, nbEntriesToDrop)
      updatedEntriesArr.push({ metadata, miniapps, jsApiImpls })
    } else {
      updatedEntriesArr = [{ metadata, miniapps, jsApiImpls }]
    }

    return this.cauldron.setCodePushEntries(
      napDescriptor,
      metadata.deploymentName,
      updatedEntriesArr
    )
  }

  public async updateCodePushEntry(
    napDescriptor: NativeApplicationDescriptor,
    deploymentName: string,
    label: string,
    {
      isDisabled,
      isMandatory,
      rollout,
    }: {
      isDisabled?: boolean
      isMandatory?: boolean
      rollout?: number
    }
  ): Promise<void> {
    const codePushEntries = await this.cauldron.getCodePushEntries(
      napDescriptor,
      deploymentName
    )
    const entry = _.find(codePushEntries, c => c.metadata.label === label)
    if (entry) {
      if (isDisabled !== undefined) {
        entry.metadata.isDisabled = isDisabled
      }
      if (isMandatory !== undefined) {
        entry.metadata.isMandatory = isMandatory
      }
      if (rollout !== undefined) {
        entry.metadata.rollout = rollout
      }
      return this.cauldron.setCodePushEntries(
        napDescriptor,
        deploymentName,
        codePushEntries
      )
    }
  }

  public async addContainerMiniApp(
    napDescriptor: NativeApplicationDescriptor,
    miniApp: PackagePath
  ): Promise<void> {
    return this.cauldron.addContainerMiniApp(napDescriptor, miniApp)
  }

  public async addContainerJsApiImpl(
    napDescriptor: NativeApplicationDescriptor,
    jsApiImpl: PackagePath
  ): Promise<void> {
    return this.cauldron.addContainerJsApiImpl(napDescriptor, jsApiImpl)
  }

  public async getContainerGeneratorConfig(
    descriptor?: NativeApplicationDescriptor
  ): Promise<any | void> {
    return this.getConfigForKey('containerGenerator', descriptor)
  }

  public async getManifestConfig(
    descriptor?: NativeApplicationDescriptor
  ): Promise<any | void> {
    return this.getConfigForKey('manifest', descriptor)
  }

  public async getBinaryStoreConfig(
    descriptor?: NativeApplicationDescriptor
  ): Promise<any | void> {
    return this.getConfigForKey('binaryStore', descriptor)
  }

  public async getCodePushConfig(
    descriptor?: NativeApplicationDescriptor
  ): Promise<any | void> {
    return this.getConfigForKey('codePush', descriptor)
  }

  /**
   * Gets the configuration associated with a given Native Application Descriptor.
   * If no configuration is found for the precise Native Application Descriptor, this
   * function will bubble up the parents and return the closest existing parent configuration.
   * For example if the Native Application Descriptor correspond to a native application version
   * but no config is set for this native application version, the function will instead
   * return the configuration of the parent native application platform (if any). If none
   * it will continue up to the native application level and final top level cauldron config.
   * Finally, if no configuration is found when reaching the top, it will return undefined.
   * @param napDescriptor Partial/Full or undefined Native Application Descriptor
   * If undefined, will return the top level Cauldron configuration.
   */
  public async getConfig(
    napDescriptor?: NativeApplicationDescriptor
  ): Promise<any | void> {
    const configByLevel = await this.cauldron.getConfigByLevel(napDescriptor)
    return (
      configByLevel.get(CauldronConfigLevel.NativeAppVersion) ||
      configByLevel.get(CauldronConfigLevel.NativeAppPlatform) ||
      configByLevel.get(CauldronConfigLevel.NativeApp) ||
      configByLevel.get(CauldronConfigLevel.Top)
    )
  }

  /**
   * Gets the configuration strictly associated with a given Native Application Descriptor.
   * At the difference of `getConfig` function, this function will not bubble up the parent
   * chain to find a config. For example, if the Native Application Descriptor correspond to
   * a native application version, but no config is set for this native application version,
   * then the function will not attempt to crawl up the parent levels to find a config, but
   * will instead directly return undefined.
   * @param napDescriptor Partial/Full or undefined Native Application Descriptor
   * If undefined, will return the top level Cauldron configuration.
   */
  public async getConfigStrict(
    napDescriptor: NativeApplicationDescriptor
  ): Promise<any | void> {
    const configByLevel = await this.cauldron.getConfigByLevel(napDescriptor)
    return configByLevel.get(
      this.getCauldronConfigLevelMatchingDescriptor(napDescriptor)
    )
  }

  /**
   * Gets the config associated with a specific key
   * It will crawl up the parent config chain if needed.
   * @param key The configuration key
   * @param napDescriptor Partial/Full or undefined Native Application Descriptor
   * If undefined, will look in the top level Cauldron configuration.
   */
  public async getConfigForKey(
    key: string,
    napDescriptor?: NativeApplicationDescriptor
  ): Promise<any | void> {
    const configByLevel = await this.cauldron.getConfigByLevel(napDescriptor)
    return (
      (configByLevel.has(CauldronConfigLevel.NativeAppVersion) &&
        configByLevel.get(CauldronConfigLevel.NativeAppVersion)[key]) ||
      (configByLevel.has(CauldronConfigLevel.NativeAppPlatform) &&
        configByLevel.get(CauldronConfigLevel.NativeAppPlatform)[key]) ||
      (configByLevel.has(CauldronConfigLevel.NativeApp) &&
        configByLevel.get(CauldronConfigLevel.NativeApp)[key]) ||
      (configByLevel.has(CauldronConfigLevel.Top) &&
        configByLevel.get(CauldronConfigLevel.Top)[key])
    )
  }

  /**
   * Gets the config associated with a specific key
   * At the difference of the `getConfigForKey` function, this function will not
   * try to find a matching config / key in the parent config levels.
   * @param key The configuration key
   * @param napDescriptor Partial/Full or undefined Native Application Descriptor
   * If undefined, will look in the top level Cauldron configuration.
   */
  public async getConfigForKeyStrict(
    key: string,
    napDescriptor?: NativeApplicationDescriptor
  ): Promise<any | void> {
    const configByLevel = await this.cauldron.getConfigByLevel(napDescriptor)
    const cauldronConfigLevel = this.getCauldronConfigLevelMatchingDescriptor(
      napDescriptor
    )
    return (
      (configByLevel.has(cauldronConfigLevel) &&
        configByLevel.get(cauldronConfigLevel)[key]) ||
      undefined
    )
  }

  public getCauldronConfigLevelMatchingDescriptor(
    napDescriptor?: NativeApplicationDescriptor
  ) {
    if (!napDescriptor) {
      return CauldronConfigLevel.Top
    } else if (napDescriptor.version) {
      return CauldronConfigLevel.NativeAppVersion
    } else if (napDescriptor.platform) {
      return CauldronConfigLevel.NativeAppPlatform
    } else {
      return CauldronConfigLevel.NativeApp
    }
  }

  public async updateNativeAppIsReleased(
    napDescriptor: NativeApplicationDescriptor,
    isReleased: boolean
  ): Promise<void> {
    return this.cauldron.updateVersion(napDescriptor, { isReleased })
  }

  public async updateContainerVersion(
    napDescriptor: NativeApplicationDescriptor,
    containerVersion: string
  ): Promise<void> {
    await this.cauldron.updateContainerVersion(napDescriptor, containerVersion)
    const topLevelContainerVersion = await this.getTopLevelContainerVersion(
      napDescriptor
    )
    if (
      semver.valid(containerVersion) &&
      topLevelContainerVersion &&
      semver.valid(topLevelContainerVersion) &&
      semver.gt(containerVersion, topLevelContainerVersion)
    ) {
      await this.cauldron.updateTopLevelContainerVersion(
        napDescriptor,
        containerVersion
      )
    }
  }

  public async getContainerVersion(
    napDescriptor: NativeApplicationDescriptor
  ): Promise<string> {
    return this.cauldron.getContainerVersion(napDescriptor)
  }

  public async getTopLevelContainerVersion(
    napDescriptor: NativeApplicationDescriptor
  ): Promise<string | void> {
    return this.cauldron.getTopLevelContainerVersion(napDescriptor)
  }

  public async updateContainerErnVersion(
    napDescriptor: NativeApplicationDescriptor,
    ernVersion: string
  ): Promise<void> {
    return this.cauldron.updateContainerErnVersion(napDescriptor, ernVersion)
  }

  public async getContainerErnVersion(
    napDescriptor: NativeApplicationDescriptor
  ): Promise<string | void> {
    return this.cauldron.getContainerErnVersion(napDescriptor)
  }

  public async updateContainerMiniAppVersion(
    napDescriptor: NativeApplicationDescriptor,
    miniApp: PackagePath
  ): Promise<void> {
    return this.cauldron.updateContainerMiniAppVersion(napDescriptor, miniApp)
  }

  public async throwIfNativeAppVersionIsReleased(
    napDescriptor: NativeApplicationDescriptor,
    errorMessage: string
  ) {
    const nativeAppVersion = await this.cauldron.getVersion(napDescriptor)
    if (nativeAppVersion.isReleased) {
      throw new Error(errorMessage)
    }
  }
}
