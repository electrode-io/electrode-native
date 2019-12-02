import _ from 'lodash'
import {
  log,
  PackagePath,
  fileUtils,
  NativePlatform,
  normalizeVersionsToSemver,
  utils as coreUtils,
  AppPlatformDescriptor,
  AppVersionDescriptor,
  AnyAppDescriptor,
} from 'ern-core'
import {
  CauldronCodePushMetadata,
  CauldronCodePushEntry,
  CauldronConfigLevel,
  CauldronNativeAppVersion,
  CauldronStartCommandConfig,
  CauldronGitHubConfig,
} from './types'
import CauldronApi from './CauldronApi'
import semver from 'semver'
import fs from 'fs-extra'

//
// Helper class to access the cauldron
// It uses the ern-cauldron-cli client
export class CauldronHelper {
  private readonly cauldron: CauldronApi

  public get api() {
    return this.cauldron
  }

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

  public async isDescriptorInCauldron(
    descriptor: AnyAppDescriptor
  ): Promise<boolean> {
    return this.cauldron.hasDescriptor(descriptor)
  }

  public async addDescriptor(descriptor: AnyAppDescriptor) {
    return this.cauldron.addDescriptor(descriptor)
  }

  public async addOrUpdateDescription(
    descriptor: AppVersionDescriptor,
    description: string
  ) {
    return this.cauldron.addOrUpdateDescription(descriptor, description)
  }

  public async removeDescriptor(descriptor: AnyAppDescriptor) {
    return this.cauldron.removeDescriptor(descriptor)
  }

  public async addNativeApplicationVersion(
    descriptor: AppVersionDescriptor,
    {
      config,
      copyFromVersion,
      description,
    }: {
      config?: any
      copyFromVersion?: string
      description?: string
    } = {}
  ) {
    if (await this.cauldron.hasDescriptor(descriptor)) {
      throw new Error(`${descriptor} already exist in Cauldron`)
    }

    if (copyFromVersion) {
      const version =
        copyFromVersion === 'latest'
          ? (await this.getMostRecentNativeApplicationVersion(descriptor)).name
          : copyFromVersion
      const sourceVersion = new AppVersionDescriptor(
        descriptor.name,
        descriptor.platform,
        version
      )
      if (!(await this.cauldron.hasDescriptor(sourceVersion))) {
        throw new Error(
          `Cannot copy from unexisting source version ${sourceVersion}`
        )
      }
      await this.addDescriptor(descriptor)
      await this.copyNativeApplicationVersion({
        shouldCopyConfig: !!!config,
        source: sourceVersion,
        target: descriptor,
      })
    } else {
      await this.addDescriptor(descriptor)
      if (description) {
        await this.cauldron.addOrUpdateDescription(descriptor, description)
      }
    }
    if (config) {
      await this.cauldron.setConfig({ descriptor, config })
    }
  }

  public async copyNativeApplicationVersion({
    source,
    target,
    shouldCopyConfig,
  }: {
    source: AppVersionDescriptor
    target: AppVersionDescriptor
    shouldCopyConfig?: boolean
  }) {
    if (!(await this.cauldron.hasDescriptor(source))) {
      throw new Error(`Source descriptor ${source} does not exist in Cauldron`)
    }
    if (!(await this.cauldron.hasDescriptor(target))) {
      throw new Error(`Target descriptor ${target} does not exist in Cauldron`)
    }
    const sourceVersion = await this.cauldron.getVersion(source)

    // Copy native container dependencies
    for (const nativeDep of sourceVersion.container.nativeDeps) {
      await this.cauldron.addPackageToContainer(
        target,
        PackagePath.fromString(nativeDep),
        'nativeDeps'
      )
    }
    // Copy container MiniApps branches
    for (const containerMiniAppBranch of sourceVersion.container
      .miniAppsBranches || []) {
      await this.cauldron.addPackageToContainer(
        target,
        PackagePath.fromString(containerMiniAppBranch),
        'miniAppsBranches'
      )
    }
    // Copy container MiniApps
    for (const containerMiniApp of sourceVersion.container.miniApps) {
      await this.cauldron.addPackageToContainer(
        target,
        PackagePath.fromString(containerMiniApp),
        'miniApps'
      )
    }
    // Copy yarn locks if any
    if (sourceVersion.yarnLocks) {
      for (const k of Object.keys(sourceVersion.yarnLocks)) {
        await this.cauldron.copyYarnLock(source, target, k)
      }
    }
    // Copy container version
    if (sourceVersion.containerVersion) {
      await this.cauldron.updateContainerVersion(
        target,
        sourceVersion.containerVersion
      )
    }
    // Copy ern version
    if (sourceVersion.container.ernVersion) {
      await this.cauldron.updateContainerErnVersion(
        target,
        sourceVersion.container.ernVersion
      )
    }
    // Copy description if any
    if (sourceVersion.description) {
      await this.cauldron.addOrUpdateDescription(
        target,
        sourceVersion.description
      )
    }
    // Copy configuration if we should (and if any)
    if (shouldCopyConfig) {
      const config = await this.getConfigStrict(source)
      if (config) {
        await this.cauldron.setConfig({ descriptor: target, config })
      }
    }
  }

  public async updateConfig({
    config,
    descriptor,
  }: {
    config: any
    descriptor?: AnyAppDescriptor
  }) {
    return this.cauldron.updateConfig({ config, descriptor })
  }

  public async getMostRecentNativeApplicationVersion(
    descriptor: AppPlatformDescriptor | AppVersionDescriptor
  ): Promise<CauldronNativeAppVersion> {
    const platformDescriptor = descriptor.toAppPlatformDescriptor()
    if (!(await this.isDescriptorInCauldron(platformDescriptor))) {
      throw new Error(`Cannot find ${platformDescriptor} in Cauldron`)
    }

    const nativeApp = await this.getDescriptor(platformDescriptor)
    const sortedNativeAppVersions = nativeApp.versions.sort((a, b) =>
      semver.rcompare(semver.coerce(b.name)!, semver.coerce(a.name)!)
    )
    return _.last(sortedNativeAppVersions) as CauldronNativeAppVersion
  }

  public async setNativeDependenciesInContainer(
    descriptor: AppVersionDescriptor,
    dependencies: PackagePath[]
  ): Promise<void> {
    await this.throwIfNativeAppVersionIsReleased(
      descriptor,
      'Cannot add a native dependency to a released native app version'
    )
    return this.cauldron.setPackagesInContainer(
      descriptor,
      dependencies,
      'nativeDeps'
    )
  }

  public async removeMiniAppFromContainer(
    descriptor: AppVersionDescriptor,
    miniApp: PackagePath
  ) {
    await this.throwIfNativeAppVersionIsReleased(
      descriptor,
      'Cannot remove a js package from a released native application version Container'
    )
    try {
      // Remove any potential branch in case previous package version
      // was tracking a branch
      await this.cauldron.removePackageFromContainer(
        descriptor,
        miniApp,
        'miniAppsBranches'
      )
    } catch (e) {
      // swallow
      // We don't really care if there was not branch associated to
      // this package, as long as cleaning is done if there was one
    }
    return this.cauldron.removePackageFromContainer(
      descriptor,
      miniApp,
      'miniApps'
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

  public async getDescriptor(descriptor: AnyAppDescriptor): Promise<any> {
    return this.cauldron.getDescriptor(descriptor)
  }

  public async getVersions(descriptor: AppPlatformDescriptor): Promise<any> {
    return this.cauldron.getVersions(descriptor)
  }

  public async getVersionsNames(
    descriptor: AppPlatformDescriptor
  ): Promise<string[]> {
    const versions = await this.getVersions(descriptor)
    return _.map(versions, v => v.name)
  }

  public async getNativeDependencies(
    descriptor: AppVersionDescriptor
  ): Promise<PackagePath[]> {
    const dependencies = await this.cauldron.getNativeDependencies(descriptor)
    return _.map(dependencies, PackagePath.fromString)
  }

  public async addFile({
    localFilePath,
    cauldronFilePath,
  }: {
    localFilePath: string
    cauldronFilePath: string
  }) {
    const fileContent = await fs.readFile(localFilePath)
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
    const fileContent = await fs.readFile(localFilePath)
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
    descriptor: AppVersionDescriptor,
    key: string
  ): Promise<boolean> {
    return this.cauldron.hasYarnLock(descriptor, key)
  }

  public async addYarnLock(
    descriptor: AppVersionDescriptor,
    key: string,
    yarnlockPath: string
  ): Promise<string> {
    const yarnLockFile = await fs.readFile(yarnlockPath)
    return this.cauldron.addYarnLock(descriptor, key, yarnLockFile)
  }

  public async getYarnLock(
    descriptor: AppVersionDescriptor,
    key: string
  ): Promise<Buffer | void> {
    return this.cauldron.getYarnLock(descriptor, key)
  }

  public async getPathToYarnLock(
    descriptor: AppVersionDescriptor,
    key: string
  ): Promise<string | void> {
    return this.cauldron.getPathToYarnLock(descriptor, key)
  }

  public async removeYarnLock(
    descriptor: AppVersionDescriptor,
    key: string
  ): Promise<boolean> {
    return this.cauldron.removeYarnLock(descriptor, key)
  }

  public async updateYarnLock(
    descriptor: AppVersionDescriptor,
    key: string,
    yarnlockPath: string
  ): Promise<boolean> {
    const yarnLockFile = await fs.readFile(yarnlockPath)
    return this.cauldron.updateYarnLock(descriptor, key, yarnLockFile)
  }

  public async setYarnLocks(
    descriptor: AppVersionDescriptor,
    yarnLocks: any
  ): Promise<void> {
    return this.cauldron.setYarnLocks(descriptor, yarnLocks)
  }

  public async addOrUpdateYarnLock(
    descriptor: AppVersionDescriptor,
    key: string,
    yarnlockPath: string
  ): Promise<any> {
    if (await this.hasYarnLock(descriptor, key)) {
      return this.updateYarnLock(descriptor, key, yarnlockPath)
    } else {
      return this.addYarnLock(descriptor, key, yarnlockPath)
    }
  }

  public async getYarnLockId(
    descriptor: AppVersionDescriptor,
    key: string
  ): Promise<string | void> {
    return this.cauldron.getYarnLockId(descriptor, key)
  }

  public async setYarnLockId(
    descriptor: AppVersionDescriptor,
    key: string,
    id: string
  ): Promise<void> {
    return this.cauldron.setYarnLockId(descriptor, key, id)
  }

  public async updateYarnLockId(
    descriptor: AppVersionDescriptor,
    key: string,
    id: string
  ): Promise<void> {
    return this.cauldron.updateYarnLockId(descriptor, key, id)
  }

  public async addBundle(
    descriptor: AppVersionDescriptor,
    bundle: string | Buffer
  ): Promise<void> {
    return this.cauldron.addBundle(descriptor, bundle)
  }

  public async hasBundle(descriptor: AppVersionDescriptor): Promise<boolean> {
    return this.cauldron.hasBundle(descriptor)
  }

  public async getBundle(descriptor: AppVersionDescriptor): Promise<Buffer> {
    return this.cauldron.getBundle(descriptor)
  }

  public async isNativeDependencyInContainer(
    descriptor: AppVersionDescriptor,
    dependencyName: string
  ): Promise<boolean> {
    return this.cauldron.isNativeDependencyInContainer(
      descriptor,
      dependencyName
    )
  }

  public async getContainerNativeDependency(
    descriptor: AppVersionDescriptor,
    dependencyName: string
  ): Promise<PackagePath> {
    const dependency = await this.cauldron.getContainerNativeDependency(
      descriptor,
      dependencyName
    )
    return PackagePath.fromString(dependency)
  }

  public async syncContainerPackages({
    descriptor,
    funcAddPackageToContainer,
    funcGetPackagesFromContainer,
    funcUpdatePackageInContainer,
    localPackages,
  }: {
    descriptor: AppVersionDescriptor
    funcAddPackageToContainer: (
      x: AppVersionDescriptor,
      y: PackagePath
    ) => Promise<void>
    funcGetPackagesFromContainer: (
      x: AppVersionDescriptor
    ) => Promise<PackagePath[]>
    funcUpdatePackageInContainer: (
      x: AppVersionDescriptor,
      y: PackagePath
    ) => Promise<void>
    localPackages: PackagePath[]
  }) {
    const cauldronPackages = await funcGetPackagesFromContainer(descriptor)
    // Add Packages that are not part of the Container
    const newPackages = _.differenceBy(
      localPackages,
      cauldronPackages,
      'basePath'
    )
    for (const newPackage of newPackages) {
      await funcAddPackageToContainer(descriptor, newPackage)
    }
    // Update Packages that have a different version
    for (const cauldronPackage of cauldronPackages) {
      const pkg = _.find(
        localPackages,
        p => p.basePath === cauldronPackage.basePath
      )
      if (pkg && pkg.version !== cauldronPackage.version) {
        await funcUpdatePackageInContainer(descriptor, pkg)
      }
    }
  }

  public async syncContainerMiniApps(
    descriptor: AppVersionDescriptor,
    localPackages: PackagePath[]
  ): Promise<void> {
    return this.syncContainerPackages({
      descriptor,
      funcAddPackageToContainer: this.addMiniAppToContainer.bind(this),
      funcGetPackagesFromContainer: this.getContainerMiniApps.bind(this),
      funcUpdatePackageInContainer: this.updateMiniAppVersionInContainer.bind(
        this
      ),
      localPackages,
    })
  }

  public async updateMiniAppVersionInContainer(
    descriptor: AppVersionDescriptor,
    miniApp: PackagePath,
    {
      keepBranch,
    }: {
      keepBranch?: boolean
    } = {}
  ): Promise<void> {
    if (miniApp.isGitPath && (await coreUtils.isGitBranch(miniApp))) {
      const commitSha = await coreUtils.getCommitShaOfGitBranchOrTag(miniApp)
      if (
        await this.cauldron.hasMiniAppBranchInContainer(descriptor, miniApp)
      ) {
        await this.cauldron.updatePackageInContainer(
          descriptor,
          miniApp,
          'miniAppsBranches'
        )
      } else {
        await this.cauldron.addPackageToContainer(
          descriptor,
          miniApp,
          'miniAppsBranches'
        )
      }

      return this.cauldron.updatePackageInContainer(
        descriptor,
        PackagePath.fromString(`${miniApp.basePath}#${commitSha}`),
        'miniApps'
      )
    } else {
      try {
        if (!keepBranch) {
          // Remove any potential branch in case previous package version
          // was tracking a branch
          await this.cauldron.removePackageFromContainer(
            descriptor,
            PackagePath.fromString(miniApp.basePath),
            'miniAppsBranches'
          )
        }
      } catch (e) {
        // swallow
        // We don't really care if there was not branch associated to
        // this MiniApp, as long as cleaning is done if there was one
      }
      return this.cauldron.updatePackageInContainer(
        descriptor,
        miniApp,
        'miniApps'
      )
    }
  }

  public async getAllNativeApps(): Promise<any> {
    return this.cauldron.getNativeApplications()
  }

  public async isMiniAppInContainer(
    descriptor: AppVersionDescriptor,
    miniApp: any
  ): Promise<boolean> {
    return this.cauldron.isMiniAppInContainer(descriptor, miniApp.toString())
  }

  public async getContainerMiniApp(
    descriptor: AppVersionDescriptor,
    miniApp: any
  ): Promise<string> {
    return this.cauldron.getContainerMiniApp(descriptor, miniApp.toString())
  }

  public async getCodePushMiniApps(
    descriptor: AppVersionDescriptor,
    deploymentName: string,
    {
      label,
    }: {
      label?: string
    } = {}
  ): Promise<PackagePath[] | void> {
    const codePushEntry = await this.getCodePushEntry(
      descriptor,
      deploymentName,
      { label }
    )
    if (codePushEntry) {
      return _.map(codePushEntry.miniapps, e => PackagePath.fromString(e))
    }
  }

  public async getCodePushEntry(
    descriptor: AppVersionDescriptor,
    deploymentName: string,
    {
      label,
    }: {
      label?: string
    } = {}
  ): Promise<CauldronCodePushEntry | void> {
    const codePushEntries = await this.cauldron.getCodePushEntries(
      descriptor,
      deploymentName
    )
    let result
    if (codePushEntries) {
      if (label) {
        result = _.find(codePushEntries, e => e.metadata.label === label)
        if (!result || result.length === 0) {
          throw new Error(
            `No CodePush entry matching label ${label} was found in ${descriptor.toString()}`
          )
        }
      } else {
        result = _.last(codePushEntries)
      }
    }
    return result
  }

  public async getContainerMiniAppsBranches(descriptor) {
    const miniAppsBranches = await this.cauldron.getContainerMiniAppsBranches(
      descriptor
    )
    return _.map(miniAppsBranches, PackagePath.fromString)
  }

  public async getContainerMiniApps(
    descriptor: AppVersionDescriptor,
    {
      favorGitBranches,
    }: {
      favorGitBranches?: boolean
    } = {}
  ): Promise<PackagePath[]> {
    try {
      const miniApps = await this.cauldron.getContainerMiniApps(descriptor)
      const result = _.map(miniApps, PackagePath.fromString)
      if (favorGitBranches) {
        const miniAppsBranches = await this.getContainerMiniAppsBranches(
          descriptor
        )
        const miniAppsWithBranches = _.intersectionBy(
          miniAppsBranches,
          result,
          'basePath'
        )
        _.remove(result, m =>
          _.map(miniAppsWithBranches, 'basePath').includes(m.basePath)
        )
        result.push(...miniAppsWithBranches)
      }
      return result
    } catch (e) {
      log.error(`[getContainerMiniApps] ${e}`)
      throw e
    }
  }

  /**
   * Gets all the MiniApps of a given native application version.
   * @param descriptor Native application version from which to retrieve MiniApps
   * @returns A promise resolving to an array of tuples. First element of the
   * tuple is the MiniApp PackagePath, second element is the optional MiniApp branch
   * PackagePath -if any- or undefined otherwise.
   */
  public async getContainerMiniAppsWithBranches(
    descriptor: AppVersionDescriptor
  ): Promise<Array<[PackagePath, PackagePath | undefined]>> {
    const miniApps = _.map(
      await this.cauldron.getContainerMiniApps(descriptor),
      PackagePath.fromString
    )
    const miniAppsBranches = await this.getContainerMiniAppsBranches(descriptor)
    return _.map(miniApps, m => [
      m,
      _.find(miniAppsBranches, n => n.basePath === m.basePath),
    ])
  }

  public async addCodePushEntry(
    descriptor: AppVersionDescriptor,
    metadata: CauldronCodePushMetadata,
    miniApps: PackagePath[]
  ): Promise<void> {
    const miniapps = _.map(miniApps, x => x.toString())
    const codePushConfig = await this.getCodePushConfig()
    let codePushEntries
    if (
      await this.cauldron.hasCodePushEntries(
        descriptor,
        metadata.deploymentName
      )
    ) {
      codePushEntries = await this.cauldron.getCodePushEntries(
        descriptor,
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
      updatedEntriesArr.push({ metadata, miniapps })
    } else {
      updatedEntriesArr = [{ metadata, miniapps }]
    }

    return this.cauldron.setCodePushEntries(
      descriptor,
      metadata.deploymentName,
      updatedEntriesArr
    )
  }

  public async updateCodePushEntry(
    descriptor: AppVersionDescriptor,
    metadata: CauldronCodePushMetadata
  ): Promise<void> {
    const codePushEntries = await this.cauldron.getCodePushEntries(
      descriptor,
      metadata.deploymentName
    )
    const entry = _.find(
      codePushEntries,
      c => c.metadata.label === metadata.label
    )
    if (entry) {
      if (metadata.description !== undefined) {
        entry.metadata.description = metadata.description
      }
      if (metadata.isDisabled !== undefined) {
        entry.metadata.isDisabled = metadata.isDisabled
      }
      if (metadata.isMandatory !== undefined) {
        entry.metadata.isMandatory = metadata.isMandatory
      }
      if (metadata.rollout !== undefined) {
        entry.metadata.rollout = metadata.rollout
      }
      return this.cauldron.setCodePushEntries(
        descriptor,
        metadata.deploymentName,
        codePushEntries
      )
    }
  }

  public async addMiniAppToContainer(
    descriptor: AppVersionDescriptor,
    miniApp: PackagePath
  ) {
    if (miniApp.isGitPath && (await coreUtils.isGitBranch(miniApp))) {
      const commitSha = await coreUtils.getCommitShaOfGitBranchOrTag(miniApp)
      await this.cauldron.addPackageToContainer(
        descriptor,
        miniApp,
        'miniAppsBranches'
      )
      return this.cauldron.addPackageToContainer(
        descriptor,
        PackagePath.fromString(`${miniApp.basePath}#${commitSha}`),
        'miniApps'
      )
    } else {
      return this.cauldron.addPackageToContainer(
        descriptor,
        miniApp,
        'miniApps'
      )
    }
  }

  public async getContainerGeneratorConfig(
    descriptor?: AnyAppDescriptor
  ): Promise<any | void> {
    return this.getConfigForKey('containerGenerator', descriptor)
  }

  public async getCompositeGeneratorConfig(descriptor?: AnyAppDescriptor) {
    return this.getConfigForKey('compositeGenerator', descriptor)
  }

  public async getManifestConfig(
    descriptor?: AnyAppDescriptor
  ): Promise<any | void> {
    return this.getConfigForKey('manifest', descriptor)
  }

  public async getBinaryStoreConfig(
    descriptor?: AnyAppDescriptor
  ): Promise<any | void> {
    return this.getConfigForKey('binaryStore', descriptor)
  }

  public async getBundleStoreConfig(
    descriptor?: AnyAppDescriptor
  ): Promise<any | void> {
    return this.getConfigForKey('bundleStore', descriptor)
  }

  public async getCodePushConfig(
    descriptor?: AnyAppDescriptor
  ): Promise<any | void> {
    return this.getConfigForKey('codePush', descriptor)
  }

  public async getSourceMapStoreConfig(
    descriptor?: AnyAppDescriptor
  ): Promise<any | void> {
    return this.getConfigForKey('sourcemapStore', descriptor)
  }

  public async getStartCommandConfig(
    descriptor?: AnyAppDescriptor
  ): Promise<CauldronStartCommandConfig | void> {
    return this.getConfigForKey('start', descriptor)
  }

  public async getGitHubConfig(
    descriptor?: AnyAppDescriptor
  ): Promise<CauldronGitHubConfig | void> {
    return this.getConfigForKey('github', descriptor)
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
   * @param descriptor Partial/Full or undefined Native Application Descriptor
   * If undefined, will return the top level Cauldron configuration.
   */
  public async getConfig(descriptor?: AnyAppDescriptor): Promise<any | void> {
    const configByLevel = await this.cauldron.getConfigByLevel(descriptor)
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
   * @param descriptor Partial/Full or undefined Native Application Descriptor
   * If undefined, will return the top level Cauldron configuration.
   */
  public async getConfigStrict(descriptor?: AnyAppDescriptor): Promise<any> {
    return this.cauldron.getConfigStrict(descriptor)
  }

  /**
   * Gets the config associated with a specific key
   * It will crawl up the parent config chain if needed.
   * @param key The configuration key
   * @param descriptor Partial/Full or undefined Native Application Descriptor
   * If undefined, will look in the top level Cauldron configuration.
   */
  public async getConfigForKey(
    key: string,
    descriptor?: AnyAppDescriptor
  ): Promise<any | void> {
    const configByLevel = await this.cauldron.getConfigByLevel(descriptor)
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
   * @param descriptor Partial/Full or undefined Native Application Descriptor
   * If undefined, will look in the top level Cauldron configuration.
   */
  public async getConfigForKeyStrict(
    key: string,
    descriptor?: AnyAppDescriptor
  ): Promise<any> {
    const config = await this.cauldron.getConfigStrict(descriptor)
    return config[key]
  }

  public async delConfig(descriptor?: AnyAppDescriptor) {
    return this.cauldron.delConfig(descriptor)
  }

  public getCauldronConfigLevelMatchingDescriptor(
    descriptor?: AnyAppDescriptor
  ) {
    return !descriptor
      ? CauldronConfigLevel.Top
      : descriptor instanceof AppVersionDescriptor
      ? CauldronConfigLevel.NativeAppVersion
      : descriptor instanceof AppPlatformDescriptor
      ? CauldronConfigLevel.NativeAppPlatform
      : CauldronConfigLevel.NativeApp
  }

  public async updateNativeAppIsReleased(
    descriptor: AppVersionDescriptor,
    isReleased: boolean
  ): Promise<void> {
    return this.cauldron.updateVersion(descriptor, { isReleased })
  }

  public async updateContainerVersion(
    descriptor: AppVersionDescriptor,
    containerVersion: string
  ): Promise<void> {
    await this.cauldron.updateContainerVersion(descriptor, containerVersion)
    const detachContainerVersionFromRoot = await this.getConfigForKey(
      'detachContainerVersionFromRoot',
      descriptor
    )
    // Update top level Container version only for non detached container versions
    if (!detachContainerVersionFromRoot) {
      const topLevelContainerVersion = await this.getTopLevelContainerVersion(
        descriptor
      )
      if (
        semver.valid(containerVersion) &&
        topLevelContainerVersion &&
        semver.valid(topLevelContainerVersion) &&
        semver.gt(containerVersion, topLevelContainerVersion)
      ) {
        await this.cauldron.updateTopLevelContainerVersion(
          descriptor,
          containerVersion
        )
      }
    }
  }

  public async getContainerVersion(
    descriptor: AppVersionDescriptor
  ): Promise<string> {
    return this.cauldron.getContainerVersion(descriptor)
  }

  public async getTopLevelContainerVersion(
    descriptor: AppVersionDescriptor
  ): Promise<string | void> {
    return this.cauldron.getTopLevelContainerVersion(descriptor)
  }

  public async updateContainerErnVersion(
    descriptor: AppVersionDescriptor,
    ernVersion: string
  ): Promise<void> {
    return this.cauldron.updateContainerErnVersion(descriptor, ernVersion)
  }

  public async getContainerErnVersion(
    descriptor: AppVersionDescriptor
  ): Promise<string | void> {
    return this.cauldron.getContainerErnVersion(descriptor)
  }

  public async getLatestShasForMiniAppsBranches(
    descriptor: AppVersionDescriptor
  ): Promise<PackagePath[]> {
    const result: PackagePath[] = []
    const miniAppsBranches = (await this.cauldron.getContainerMiniAppsBranches(
      descriptor
    )).map(p => PackagePath.fromString(p))
    const miniApps = (await this.cauldron.getContainerMiniApps(descriptor)).map(
      p => PackagePath.fromString(p)
    )
    for (const miniAppBranch of miniAppsBranches) {
      const latestCommitSha = await coreUtils.getCommitShaOfGitBranchOrTag(
        miniAppBranch
      )
      const matchingMiniApp = miniApps.find(
        m => m.basePath === miniAppBranch.basePath
      )
      if (matchingMiniApp!.version !== latestCommitSha) {
        const newPackagePath = PackagePath.fromString(
          `${miniAppBranch.basePath}#${latestCommitSha}`
        )
        result.push(newPackagePath)
      }
    }
    return result
  }

  public async emptyContainer(descriptor: AppVersionDescriptor) {
    return this.cauldron.emptyContainer(descriptor)
  }

  //
  // Retrieves all native applications versions from the Cauldron, optionaly
  // filtered by platform/and or release status and returns them as an array
  // of native application descriptor strings
  public async getNapDescriptorStrings({
    platform,
    onlyReleasedVersions,
    onlyNonReleasedVersions,
  }: {
    platform?: NativePlatform
    onlyReleasedVersions?: boolean
    onlyNonReleasedVersions?: boolean
  } = {}): Promise<string[]> {
    const nativeApps = await this.getAllNativeApps()
    return <any>_.filter(
      _.flattenDeep(
        _.map(nativeApps, nativeApp =>
          _.map(nativeApp.platforms, p =>
            _.map(p.versions, version => {
              if (!platform || platform === p.name) {
                if (
                  (version.isReleased && !onlyNonReleasedVersions) ||
                  (!version.isReleased && !onlyReleasedVersions)
                ) {
                  return `${nativeApp.name}:${p.name}:${version.name}`
                }
              }
            })
          )
        )
      ),
      elt => elt !== undefined
    )
  }

  public async getDescriptorsMatchingSemVerDescriptor(
    semVerDescriptor: AppVersionDescriptor
  ): Promise<AppVersionDescriptor[]> {
    const result: AppVersionDescriptor[] = []
    const versionsNames = await this.getVersionsNames(semVerDescriptor)
    const semVerVersionNames = normalizeVersionsToSemver(versionsNames)
    const zippedVersions = _.zipWith(
      versionsNames,
      semVerVersionNames,
      (nonSemVer, semVer) => ({ nonSemVer, semVer })
    )

    const versions = _.filter(zippedVersions, z =>
      semver.satisfies(z.semVer, <string>semVerDescriptor.version)
    )
    for (const version of versions) {
      const descriptor = new AppVersionDescriptor(
        semVerDescriptor.name,
        semVerDescriptor.platform,
        version.nonSemVer
      )
      result.push(descriptor)
    }

    return result
  }

  public async throwIfNativeAppVersionIsReleased(
    descriptor: AppVersionDescriptor,
    errorMessage: string
  ) {
    const nativeAppVersion = await this.cauldron.getVersion(descriptor)
    if (nativeAppVersion.isReleased) {
      throw new Error(errorMessage)
    }
  }
}
