import _ from 'lodash'
import {
  log,
  PackagePath,
  NativeApplicationDescriptor,
  fileUtils,
  NativePlatform,
  normalizeVersionsToSemver,
  utils as coreUtils,
} from 'ern-core'
import {
  CauldronCodePushMetadata,
  CauldronCodePushEntry,
  CauldronConfigLevel,
  CauldronNativeAppVersion,
  CauldronStartCommandConfig,
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

  public async isDescriptorInCauldron(
    napDescriptor: NativeApplicationDescriptor
  ): Promise<boolean> {
    return this.cauldron.hasDescriptor(napDescriptor)
  }

  public async addDescriptor(napDescriptor: NativeApplicationDescriptor) {
    return this.cauldron.addDescriptor(napDescriptor)
  }

  public async addOrUpdateDescription(
    descriptor: NativeApplicationDescriptor,
    description: string
  ) {
    return this.cauldron.addOrUpdateDescription(descriptor, description)
  }

  public async removeDescriptor(napDescriptor: NativeApplicationDescriptor) {
    return this.cauldron.removeDescriptor(napDescriptor)
  }

  public async addNativeApplicationVersion(
    descriptor: NativeApplicationDescriptor,
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
    if (descriptor.isPartial) {
      throw new Error(`${descriptor} is partial`)
    }
    if (await this.cauldron.hasDescriptor(descriptor)) {
      throw new Error(`${descriptor} already exist in Cauldron`)
    }

    if (copyFromVersion) {
      const version =
        copyFromVersion === 'latest'
          ? (await this.getMostRecentNativeApplicationVersion(descriptor)).name
          : copyFromVersion
      await this.addDescriptor(descriptor)
      await this.copyNativeApplicationVersion({
        shouldCopyConfig: !!!config,
        source: new NativeApplicationDescriptor(
          descriptor.name,
          descriptor.platform,
          version
        ),
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
    source: NativeApplicationDescriptor
    target: NativeApplicationDescriptor
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
      await this.cauldron.addNativeDependencyToContainer(
        target,
        PackagePath.fromString(nativeDep)
      )
    }
    // Copy container MiniApps branches
    for (const containerMiniAppBranch of sourceVersion.container
      .miniAppsBranches || []) {
      await this.cauldron.addMiniAppBranchToContainer(
        target,
        PackagePath.fromString(containerMiniAppBranch)
      )
    }
    // Copy container MiniApps
    for (const containerMiniApp of sourceVersion.container.miniApps) {
      await this.cauldron.addMiniAppToContainer(
        target,
        PackagePath.fromString(containerMiniApp)
      )
    }
    // Copy container JS API implementations branches
    for (const containerJsApiImplBranch of sourceVersion.container
      .jsApiImplsBranches || []) {
      await this.cauldron.addJsApiImplBranchToContainer(
        target,
        PackagePath.fromString(containerJsApiImplBranch)
      )
    }
    // Copy container JS API implementations
    for (const containerJsApiImpl of sourceVersion.container.jsApiImpls) {
      await this.cauldron.addJsApiImplToContainer(
        target,
        PackagePath.fromString(containerJsApiImpl)
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
    descriptor?: NativeApplicationDescriptor
  }) {
    return this.cauldron.updateConfig({ config, descriptor })
  }

  public async getMostRecentNativeApplicationVersion(
    descriptor: NativeApplicationDescriptor
  ): Promise<CauldronNativeAppVersion> {
    const partialDescriptor = new NativeApplicationDescriptor(
      descriptor.name,
      descriptor.platform
    )
    if (!(await this.isDescriptorInCauldron(partialDescriptor))) {
      throw new Error(`Cannot find ${partialDescriptor} in Cauldron`)
    }

    const nativeApp = await this.getDescriptor(partialDescriptor)
    const sortedNativeAppVersions = nativeApp.versions.sort((a, b) =>
      semver.rcompare(semver.coerce(b.name)!, semver.coerce(a.name)!)
    )
    return _.last(sortedNativeAppVersions) as CauldronNativeAppVersion
  }

  public async addNativeDependencyToContainer(
    napDescriptor: NativeApplicationDescriptor,
    dependency: PackagePath
  ): Promise<void> {
    await this.throwIfNativeAppVersionIsReleased(
      napDescriptor,
      'Cannot add a native dependency to a released native app version'
    )
    return this.cauldron.addNativeDependencyToContainer(
      napDescriptor,
      dependency
    )
  }

  public async removeNativeDependencyFromContainer(
    napDescriptor: NativeApplicationDescriptor,
    dependency: PackagePath
  ): Promise<void> {
    await this.throwIfNativeAppVersionIsReleased(
      napDescriptor,
      'Cannot remove a native dependency from a released native app version'
    )
    return this.cauldron.removeNativeDependencyFromContainer(
      napDescriptor,
      dependency
    )
  }

  public async removeMiniAppFromContainer(
    napDescriptor: NativeApplicationDescriptor,
    miniApp: PackagePath
  ): Promise<void> {
    await this.throwIfNativeAppVersionIsReleased(
      napDescriptor,
      'Cannot remove a MiniApp for a released native app version'
    )
    try {
      // Remove any potential branch in case previous MiniApp version
      // was tracking a branch
      await this.cauldron.removeMiniAppBranchFromContainer(
        napDescriptor,
        PackagePath.fromString(miniApp.basePath)
      )
    } catch (e) {
      // swallow
      // We don't really care if there was not branch associated to
      // this MiniApp, as long as cleaning is done if there was one
    }
    return this.cauldron.removeMiniAppFromContainer(napDescriptor, miniApp)
  }

  public async removeJsApiImplFromContainer(
    napDescriptor: NativeApplicationDescriptor,
    jsApiImpl: PackagePath
  ): Promise<void> {
    await this.throwIfNativeAppVersionIsReleased(
      napDescriptor,
      'Cannot remove a JS API Implementation from a released native app version'
    )
    try {
      // Remove any potential branch in case previous JS API Impl version
      // was tracking a branch
      await this.cauldron.removeJsApiImplBranchFromContainer(
        napDescriptor,
        PackagePath.fromString(jsApiImpl.basePath)
      )
    } catch (e) {
      // swallow
      // We don't really care if there was not branch associated to
      // this JS API Implementation, as long as cleaning is done if there was one
    }
    return this.cauldron.removeJsApiImplFromContainer(napDescriptor, jsApiImpl)
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
  ): Promise<string> {
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

  public async updateNativeDependencyVersionInContainer(
    napDescriptor: NativeApplicationDescriptor,
    dependency: PackagePath
  ): Promise<void> {
    await this.throwIfNativeAppVersionIsReleased(
      napDescriptor,
      'Cannot update a native dependency for a released native app version'
    )
    return this.cauldron.updateNativeDependencyVersionInContainer(
      napDescriptor,
      dependency
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
      await this.addMiniAppToContainer(napDescriptor, newMiniApp)
    }
    // Update MiniApps that have a different version
    for (const cauldronMiniApp of cauldronMiniApps) {
      const miniapp = _.find(
        miniappsPackagePath,
        d => d.basePath === cauldronMiniApp.basePath
      )
      if (miniapp && miniapp.version !== cauldronMiniApp.version) {
        await this.updateMiniAppVersionInContainer(napDescriptor, miniapp)
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
      await this.addJsApiImplToContainer(napDescriptor, newJsApiImpl)
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
        await this.updateJsApiImplVersionInContainer(napDescriptor, jsApiImpl)
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
      await this.addNativeDependencyToContainer(
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
        await this.updateNativeDependencyVersionInContainer(napDescriptor, dep)
      }
    }
  }

  public async updateJsApiImplVersionInContainer(
    napDescriptor: NativeApplicationDescriptor,
    jsApiImpl: PackagePath,
    {
      keepBranch,
    }: {
      keepBranch?: boolean
    } = {}
  ): Promise<void> {
    if (jsApiImpl.isGitPath && (await coreUtils.isGitBranch(jsApiImpl))) {
      const commitSha = await coreUtils.getCommitShaOfGitBranchOrTag(jsApiImpl)
      if (
        await this.cauldron.hasJsApiImplBranchInContainer(
          napDescriptor,
          jsApiImpl
        )
      ) {
        await this.cauldron.updateJsApiImplBranchInContainer(
          napDescriptor,
          jsApiImpl
        )
      } else {
        await this.cauldron.addJsApiImplBranchToContainer(
          napDescriptor,
          jsApiImpl
        )
      }

      return this.cauldron.updateJsApiImplVersionInContainer(
        napDescriptor,
        PackagePath.fromString(`${jsApiImpl.basePath}#${commitSha}`)
      )
    } else {
      try {
        if (!keepBranch) {
          // Remove any potential branch in case previous MiniApp version
          // was tracking a branch
          await this.cauldron.removeJsApiImplBranchFromContainer(
            napDescriptor,
            PackagePath.fromString(jsApiImpl.basePath)
          )
        }
      } catch (e) {
        // swallow
        // We don't really care if there was not branch associated to
        // this MiniApp, as long as cleaning is done if there was one
      }
      return this.cauldron.updateJsApiImplVersionInContainer(
        napDescriptor,
        jsApiImpl
      )
    }
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

  public async getContainerMiniAppsBranches(napDescriptor) {
    const miniAppsBranches = await this.cauldron.getContainerMiniAppsBranches(
      napDescriptor
    )
    return _.map(miniAppsBranches, PackagePath.fromString)
  }

  public async getContainerMiniApps(
    napDescriptor: NativeApplicationDescriptor,
    {
      favorGitBranches,
    }: {
      favorGitBranches?: boolean
    } = {}
  ): Promise<PackagePath[]> {
    try {
      const miniApps = await this.cauldron.getContainerMiniApps(napDescriptor)
      const result = _.map(miniApps, PackagePath.fromString)
      if (favorGitBranches) {
        const miniAppsBranches = await this.getContainerMiniAppsBranches(
          napDescriptor
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
    metadata: CauldronCodePushMetadata
  ): Promise<void> {
    const codePushEntries = await this.cauldron.getCodePushEntries(
      napDescriptor,
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
        napDescriptor,
        metadata.deploymentName,
        codePushEntries
      )
    }
  }

  public async addMiniAppBranchToContainer(
    napDescriptor: NativeApplicationDescriptor,
    miniApp: PackagePath
  ): Promise<void> {
    return this.cauldron.addMiniAppBranchToContainer(napDescriptor, miniApp)
  }

  public async updateMiniAppBranchInContainer(
    napDescriptor: NativeApplicationDescriptor,
    miniApp: PackagePath
  ): Promise<void> {
    return this.cauldron.updateMiniAppBranchInContainer(napDescriptor, miniApp)
  }

  public async removeMiniAppBranchFromContainer(
    napDescriptor: NativeApplicationDescriptor,
    miniApp: PackagePath
  ): Promise<void> {
    return this.cauldron.removeMiniAppBranchFromContainer(
      napDescriptor,
      miniApp
    )
  }

  public async addJsApiImplBranchToContainer(
    napDescriptor: NativeApplicationDescriptor,
    jsApiImpl: PackagePath
  ): Promise<void> {
    return this.cauldron.addJsApiImplBranchToContainer(napDescriptor, jsApiImpl)
  }

  public async updateJsApiImplBranchInContainer(
    napDescriptor: NativeApplicationDescriptor,
    jsApiImpl: PackagePath
  ): Promise<void> {
    return this.cauldron.updateJsApiImplBranchInContainer(
      napDescriptor,
      jsApiImpl
    )
  }

  public async removeJsApiImplBranchFromContainer(
    napDescriptor: NativeApplicationDescriptor,
    jsApiImpl: PackagePath
  ): Promise<void> {
    return this.cauldron.removeJsApiImplBranchFromContainer(
      napDescriptor,
      jsApiImpl
    )
  }

  public async addMiniAppToContainer(
    napDescriptor: NativeApplicationDescriptor,
    miniApp: PackagePath
  ): Promise<void> {
    if (miniApp.isGitPath && (await coreUtils.isGitBranch(miniApp))) {
      const commitSha = await coreUtils.getCommitShaOfGitBranchOrTag(miniApp)
      await this.cauldron.addMiniAppBranchToContainer(napDescriptor, miniApp)
      return this.cauldron.addMiniAppToContainer(
        napDescriptor,
        PackagePath.fromString(`${miniApp.basePath}#${commitSha}`)
      )
    } else {
      return this.cauldron.addMiniAppToContainer(napDescriptor, miniApp)
    }
  }

  public async addJsApiImplToContainer(
    napDescriptor: NativeApplicationDescriptor,
    jsApiImpl: PackagePath
  ): Promise<void> {
    if (jsApiImpl.isGitPath && (await coreUtils.isGitBranch(jsApiImpl))) {
      const commitSha = await coreUtils.getCommitShaOfGitBranchOrTag(jsApiImpl)
      await this.cauldron.addJsApiImplBranchToContainer(
        napDescriptor,
        jsApiImpl
      )
      await this.cauldron.addJsApiImplToContainer(
        napDescriptor,
        PackagePath.fromString(`${jsApiImpl.basePath}#${commitSha}`)
      )
    } else {
      await this.cauldron.addJsApiImplToContainer(napDescriptor, jsApiImpl)
    }
  }

  public async getContainerGeneratorConfig(
    descriptor?: NativeApplicationDescriptor
  ): Promise<any | void> {
    return this.getConfigForKey('containerGenerator', descriptor)
  }

  public async getCompositeGeneratorConfig(
    descriptor?: NativeApplicationDescriptor
  ) {
    return this.getConfigForKey('compositeGenerator', descriptor)
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

  public async getStartCommandConfig(
    descriptor?: NativeApplicationDescriptor
  ): Promise<CauldronStartCommandConfig | void> {
    return this.getConfigForKey('start', descriptor)
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
    napDescriptor?: NativeApplicationDescriptor
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

  public async delConfig(napDescriptor?: NativeApplicationDescriptor) {
    return this.cauldron.delConfig(napDescriptor)
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
    const detachContainerVersionFromRoot = await this.getConfigForKey(
      'detachContainerVersionFromRoot',
      napDescriptor
    )
    // Update top level Container version only for non detached container versions
    if (!detachContainerVersionFromRoot) {
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

  public async updateMiniAppVersionInContainer(
    napDescriptor: NativeApplicationDescriptor,
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
        await this.cauldron.hasMiniAppBranchInContainer(napDescriptor, miniApp)
      ) {
        await this.cauldron.updateMiniAppBranchInContainer(
          napDescriptor,
          miniApp
        )
      } else {
        await this.cauldron.addMiniAppBranchToContainer(napDescriptor, miniApp)
      }

      return this.cauldron.updateMiniAppVersionInContainer(
        napDescriptor,
        PackagePath.fromString(`${miniApp.basePath}#${commitSha}`)
      )
    } else {
      try {
        if (!keepBranch) {
          // Remove any potential branch in case previous MiniApp version
          // was tracking a branch
          await this.cauldron.removeMiniAppBranchFromContainer(
            napDescriptor,
            PackagePath.fromString(miniApp.basePath)
          )
        }
      } catch (e) {
        // swallow
        // We don't really care if there was not branch associated to
        // this MiniApp, as long as cleaning is done if there was one
      }
      return this.cauldron.updateMiniAppVersionInContainer(
        napDescriptor,
        miniApp
      )
    }
  }

  public async getLatestShasForMiniAppsBranches(
    descriptor: NativeApplicationDescriptor
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

  public async getLatestShasForJsApiImplsBranches(
    descriptor: NativeApplicationDescriptor
  ) {
    const result: PackagePath[] = []
    const jsApiImplsBranches = (await this.cauldron.getContainerJsApiImplsBranches(
      descriptor
    )).map(p => PackagePath.fromString(p))
    const jsApiImpls = (await this.cauldron.getContainerJsApiImpls(
      descriptor
    )).map(p => PackagePath.fromString(p))
    for (const jsApiImplBranch of jsApiImplsBranches) {
      const latestCommitSha = await coreUtils.getCommitShaOfGitBranchOrTag(
        jsApiImplBranch
      )
      const matchingJsApiImpl = jsApiImpls.find(
        m => m.basePath === jsApiImplBranch.basePath
      )
      if (matchingJsApiImpl!.version !== latestCommitSha) {
        const newPackagePath = PackagePath.fromString(
          `${jsApiImplBranch.basePath}#${latestCommitSha}`
        )
        result.push(newPackagePath)
      }
    }
    return result
  }

  public async emptyContainer(descriptor: NativeApplicationDescriptor) {
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
    semVerDescriptor: NativeApplicationDescriptor
  ): Promise<NativeApplicationDescriptor[]> {
    if (!semVerDescriptor.platform || !semVerDescriptor.version) {
      throw new Error(
        `${semVerDescriptor.toString()} descriptor is missing platform and/or version`
      )
    }
    const result: NativeApplicationDescriptor[] = []
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
      const descriptor = new NativeApplicationDescriptor(
        semVerDescriptor.name,
        semVerDescriptor.platform,
        version.nonSemVer
      )
      result.push(descriptor)
    }

    return result
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
