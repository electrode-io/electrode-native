// @flow

import PackagePath from './PackagePath'
import NativeApplicationDescriptor from './NativeApplicationDescriptor'
import * as fileUtils from './fileUtil'
import * as promptUtils from './promptUtils'
import _ from 'lodash'
import type {
  CauldronApi,
  CauldronCodePushMetadata
} from 'ern-cauldron-api'

//
// Helper class to access the cauldron
// It uses the ern-cauldron-cli client
export default class CauldronHelper {
  cauldron: CauldronApi

  constructor (cauldronApi: CauldronApi) {
    if (!cauldronApi) {
      throw new Error('cauldronApi is required')
    }
    this.cauldron = cauldronApi
  }

  async beginTransaction () : Promise<void> {
    return this.cauldron.beginTransaction()
  }

  async discardTransaction () : Promise<void> {
    return this.cauldron.discardTransaction()
  }

  async commitTransaction (message: string | Array<string>) : Promise<void> {
    return this.cauldron.commitTransaction(message)
  }

  async getCauldronSchemaVersion () : Promise<string> {
    return this.cauldron.getCauldronSchemaVersion()
  }

  async upgradeCauldronSchema () : Promise<void> {
    return this.cauldron.upgradeCauldronSchema()
  }

  async isDescriptorInCauldron (napDescriptor: NativeApplicationDescriptor) : Promise<boolean> {
    return this.cauldron.hasDescriptor(napDescriptor)
  }

  async addDescriptor (napDescriptor: NativeApplicationDescriptor) {
    return this.cauldron.addDescriptor(napDescriptor)
  }

  async removeDescriptor (napDescriptor: NativeApplicationDescriptor) {
    return this.cauldron.removeDescriptor(napDescriptor)
  }

  async addContainerNativeDependency (
    napDescriptor: NativeApplicationDescriptor,
    dependency: PackagePath) : Promise<void> {
    await this.throwIfNativeAppVersionIsReleased(napDescriptor,
      'Cannot add a native dependency to a released native app version')
    return this.cauldron.addContainerNativeDependency(napDescriptor, dependency)
  }

  async removeContainerNativeDependency (
    napDescriptor: NativeApplicationDescriptor,
    dependency: PackagePath) : Promise<void> {
    await this.throwIfNativeAppVersionIsReleased(napDescriptor,
      'Cannot remove a native dependency from a released native app version')
    return this.cauldron.removeContainerNativeDependency(napDescriptor, dependency.basePath)
  }

  async removeContainerMiniApp (
    napDescriptor: NativeApplicationDescriptor,
    miniAppName: PackagePath) : Promise<void> {
    await this.throwIfNativeAppVersionIsReleased(napDescriptor,
      'Cannot remove a MiniApp for a released native app version')
    return this.cauldron.removeContainerMiniApp(napDescriptor, miniAppName.basePath)
  }

  async removeContainerJsApiImpl (
    napDescriptor: NativeApplicationDescriptor,
    jsApiImpl: PackagePath) : Promise<void> {
    await this.throwIfNativeAppVersionIsReleased(napDescriptor,
      'Cannot remove a JS API impl from the Container of a released native app version')
    return this.cauldron.removeContainerJsApiImpl(napDescriptor, jsApiImpl.basePath)
  }

  async addPublisher (
    publisherType: ('maven' | 'github'),
    url: string,
    napDescriptor: ?NativeApplicationDescriptor) : Promise<void> {
    let nativeAppName, platform
    if (napDescriptor) {
      nativeAppName = napDescriptor.name
      platform = napDescriptor.platform
    } else {
      platform = publisherType === 'maven'
        ? 'android'
        : await promptUtils.askUserToChooseAnOption(['android', 'ios'], 'Choose a platform to add this publisher')

      const nativeApps: Array<string> = await this.getNativeAppsForPlatform(platform)
      if (nativeApps && nativeApps.length > 0) {
        nativeAppName = nativeApps.length === 1
          ? nativeApps[0]
          : await promptUtils.askUserToChooseAnOption(nativeApps, 'Choose an application to add this publisher')
      } else {
        throw new Error(`Looks like there are no application defined in cauldron for ${platform}`)
      }
    }
    log.info('Adding publisher to native app')
    await this.cauldron.addPublisher(new NativeApplicationDescriptor(nativeAppName, platform), publisherType, url)
  }

  async getNativeAppsForPlatform (platformName: string): Promise<Array<string>> {
    const availableNativeApps = await this.getAllNativeApps()
    const nativeAppsForGivenPlatform = []
    if (availableNativeApps) {
      for (const nativeApp of availableNativeApps) {
        for (const platform of nativeApp.platforms) {
          if (platform.name === platformName) {
            nativeAppsForGivenPlatform.push(nativeApp.name)
          }
        }
      }
    }
    return Promise.resolve(nativeAppsForGivenPlatform)
  }

  async getDescriptor (napDescriptor: NativeApplicationDescriptor) : Promise<Object> {
    return this.cauldron.getDescriptor(napDescriptor)
  }

  async getVersions (napDescriptor: NativeApplicationDescriptor) : Promise<Object> {
    if (!napDescriptor.platform) {
      throw new Error(`[getVersions] platform must be present in the NativeApplicationDesctiptor`)
    }
    return this.cauldron.getVersions(napDescriptor)
  }

  async getVersionsNames (napDescriptor: NativeApplicationDescriptor) : Promise<Array<string>> {
    const versions = await this.getVersions(napDescriptor)
    return _.map(versions, v => v.name)
  }

  async getNativeDependencies (
    napDescriptor: NativeApplicationDescriptor) : Promise<Array<PackagePath>> {
    const dependencies = await this.cauldron.getNativeDependencies(napDescriptor)
    return _.map(dependencies, PackagePath.fromString)
  }

  async hasYarnLock (
    napDescriptor: NativeApplicationDescriptor,
    key: string) : Promise<boolean> {
    return this.cauldron.hasYarnLock(napDescriptor, key)
  }

  async addYarnLock (
    napDescriptor: NativeApplicationDescriptor,
    key: string,
    yarnlockPath: string) : Promise<void> {
    let yarnLockFile = await fileUtils.readFile(yarnlockPath)
    return this.cauldron.addYarnLock(napDescriptor, key, yarnLockFile)
  }

  async getYarnLock (
    napDescriptor: NativeApplicationDescriptor,
    key: string) : Promise<?Buffer> {
    return this.cauldron.getYarnLock(napDescriptor, key)
  }

  async getPathToYarnLock (
    napDescriptor: NativeApplicationDescriptor,
    key: string) : Promise<?string> {
    return this.cauldron.getPathToYarnLock(napDescriptor, key)
  }

  async removeYarnLock (
    napDescriptor: NativeApplicationDescriptor,
    key: string) : Promise<boolean> {
    return this.cauldron.removeYarnLock(napDescriptor, key)
  }

  async updateYarnLock (
    napDescriptor: NativeApplicationDescriptor,
    key: string,
    yarnlockPath: string) : Promise<boolean> {
    let yarnLockFile = await fileUtils.readFile(yarnlockPath)
    return this.cauldron.updateYarnLock(napDescriptor, key, yarnLockFile)
  }

  async setYarnLocks (
    napDescriptor: NativeApplicationDescriptor,
    yarnLocks: Object) : Promise<void> {
    return this.cauldron.setYarnLocks(napDescriptor, yarnLocks)
  }

  async addOrUpdateYarnLock (
    napDescriptor: NativeApplicationDescriptor,
    key: string,
    yarnlockPath: string) : Promise<*> {
    if (await this.hasYarnLock(napDescriptor, key)) {
      return this.updateYarnLock(napDescriptor, key, yarnlockPath)
    } else {
      return this.addYarnLock(napDescriptor, key, yarnlockPath)
    }
  }

  async getYarnLockId (
    napDescriptor: NativeApplicationDescriptor,
    key: string) : Promise<?string> {
    return this.cauldron.getYarnLockId(napDescriptor, key)
  }

  async setYarnLockId (
    napDescriptor: NativeApplicationDescriptor,
    key: string,
    id: string) : Promise<void> {
    return this.cauldron.setYarnLockId(napDescriptor, key, id)
  }

  async updateYarnLockId (
    napDescriptor: NativeApplicationDescriptor,
    key: string,
    id: string) : Promise<void> {
    return this.cauldron.updateYarnLockId(napDescriptor, key, id)
  }

  async isNativeDependencyInContainer (
    napDescriptor: NativeApplicationDescriptor,
    dependencyName: string) : Promise<boolean> {
    return this.cauldron.isNativeDependencyInContainer(napDescriptor, dependencyName)
  }

  async getContainerNativeDependency (
    napDescriptor: NativeApplicationDescriptor,
    dependencyName: string) : Promise<PackagePath> {
    const dependency = await this.cauldron.getContainerNativeDependency(napDescriptor, dependencyName)
    return PackagePath.fromString(dependency)
  }

  async updateContainerNativeDependencyVersion (
    napDescriptor: NativeApplicationDescriptor,
    dependencyName: string,
    newVersion: string) : Promise<void> {
    await this.throwIfNativeAppVersionIsReleased(napDescriptor,
      'Cannot update a native dependency for a released native app version')
    return this.cauldron.updateContainerNativeDependencyVersion(napDescriptor, dependencyName, newVersion)
  }

  async updateContainerJsApiImplVersion (
    napDescriptor: NativeApplicationDescriptor,
    jsApiImplName: string,
    newVersion: string) : Promise<void> {
    await this.throwIfNativeAppVersionIsReleased(napDescriptor,
      'Cannot update a JS API implementation in the Container of a released native app version')
    return this.cauldron.updateContainerJsApiImplVersion(napDescriptor, jsApiImplName, newVersion)
  }

  async getAllNativeApps () : Promise<*> {
    return this.cauldron.getNativeApplications()
  }

  async getContainerJsApiImpls (
    napDescriptor: NativeApplicationDescriptor) : Promise<Array<PackagePath>> {
    const jsApiImpls = await this.cauldron.getContainerJsApiImpls(napDescriptor)
    return _.map(jsApiImpls, j => PackagePath.fromString(j))
  }

  async getContainerJsApiImpl (
    napDescriptor: NativeApplicationDescriptor,
    jsApiImpl: PackagePath) : Promise<string> {
    return this.cauldron.getContainerJsApiImpl(napDescriptor, jsApiImpl.toString())
  }

  async getCodePushJsApiImpls (
    napDescriptor: NativeApplicationDescriptor,
    deploymentName: string) : Promise<Array<PackagePath> | void> {
    const codePushEntries = await this.cauldron.getCodePushEntries(napDescriptor, deploymentName)
    if (codePushEntries) {
      const lastEntry = _.last(codePushEntries)
      return _.map(lastEntry.jsApiImpls, e => PackagePath.fromString(e))
    }
  }

  async isMiniAppInContainer (
    napDescriptor: NativeApplicationDescriptor,
    miniApp: string | Object) : Promise<boolean> {
    return this.cauldron.isMiniAppInContainer(napDescriptor, miniApp.toString())
  }

  async getContainerMiniApp (
    napDescriptor: NativeApplicationDescriptor,
    miniApp: string | Object) : Promise<string> {
    return this.cauldron.getContainerMiniApp(napDescriptor, miniApp.toString())
  }

  async getCodePushMiniApps (
    napDescriptor: NativeApplicationDescriptor,
    deploymentName: string) : Promise<Array<PackagePath> | void> {
    const codePushEntries = await this.cauldron.getCodePushEntries(napDescriptor, deploymentName)
    if (codePushEntries) {
      const lastEntry = _.last(codePushEntries)
      return _.map(lastEntry.miniapps, e => PackagePath.fromString(e))
    }
  }

  async getContainerMiniApps (
    napDescriptor: NativeApplicationDescriptor) : Promise<Array<PackagePath>> {
    try {
      const miniApps = await this.cauldron.getContainerMiniApps(napDescriptor)
      return _.map(miniApps, PackagePath.fromString)
    } catch (e) {
      log.error(`[getContainerMiniApps] ${e}`)
      throw e
    }
  }

  async addCodePushEntry (
    napDescriptor: NativeApplicationDescriptor,
    metadata: CauldronCodePushMetadata,
    miniApps: Array<PackagePath>,
    jsApiImplementations: Array<PackagePath>) : Promise<void> {
    const miniapps = _.map(miniApps, x => x.toString())
    const jsApiImpls = _.map(jsApiImplementations, x => x.toString())
    const codePushConfig = await this.getCodePushConfig()
    let codePushEntries
    if (await this.cauldron.hasCodePushEntries(napDescriptor, metadata.deploymentName)) {
      codePushEntries = await this.cauldron.getCodePushEntries(napDescriptor, metadata.deploymentName)
    }
    let nbEntriesToDrop = 0
    let updatedEntriesArr

    if (codePushEntries) {
      if (codePushConfig &&
          codePushConfig.entriesLimit &&
          codePushEntries.length >= codePushConfig.entriesLimit) {
        nbEntriesToDrop = codePushEntries.length - codePushConfig.entriesLimit + 1
      }
      updatedEntriesArr = _.drop(codePushEntries, nbEntriesToDrop)
      updatedEntriesArr.push({ metadata, miniapps, jsApiImpls })
    } else {
      updatedEntriesArr = [ { metadata, miniapps, jsApiImpls } ]
    }

    return this.cauldron.setCodePushEntries(
      napDescriptor,
      metadata.deploymentName,
      updatedEntriesArr)
  }

  async updateCodePushEntry (
    napDescriptor: NativeApplicationDescriptor,
    deploymentName: string,
    label: string, {
      isDisabled,
      isMandatory,
      rollout
    } : {
      isDisabled?: boolean,
      isMandatory?: boolean,
      rollout?: number
    }) : Promise<void> {
    const codePushEntries = await this.cauldron.getCodePushEntries(napDescriptor, deploymentName)
    let entry = _.find(codePushEntries, c => c.metadata.label === label)
    if (entry) {
      console.log('found entry')
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
        codePushEntries)
    }
  }

  async addContainerMiniApp (
    napDescriptor: NativeApplicationDescriptor,
    miniApp: Object) : Promise<void> {
    return this.cauldron.addContainerMiniApp(napDescriptor, miniApp)
  }

  async addContainerJsApiImpl (
    napDescriptor: NativeApplicationDescriptor,
    jsApiImpl: PackagePath) : Promise<void> {
    return this.cauldron.addContainerJsApiImpl(napDescriptor, jsApiImpl)
  }

  async getContainerGeneratorConfig (napDescriptor: NativeApplicationDescriptor) : Promise<*> {
    return this.getConfigForKey(napDescriptor, 'containerGenerator')
  }

  async getManifestConfig () : Promise<?Object> {
    const config = await this.cauldron.getConfig()
    return config && config.manifest
  }

  async getBinaryStoreConfig () : Promise<?Object> {
    const config = await this.cauldron.getConfig()
    return config && config.binaryStore
  }

  async getCodePushConfig (descriptor?: NativeApplicationDescriptor) : Promise<?Object> {
    const config = await this.cauldron.getConfig(descriptor)
    return config && config.codePush
  }

  async getConfig (napDescriptor: NativeApplicationDescriptor) : Promise<?Object> {
    let config = await this.cauldron.getConfig(napDescriptor)
    if (!config) {
      config = await this.cauldron.getConfig(napDescriptor.withoutVersion())
      if (!config) {
        config = await this.cauldron.getConfig(new NativeApplicationDescriptor(napDescriptor.name))
      }
    }
    return config
  }

  async getConfigForKey (napDescriptor: NativeApplicationDescriptor, key: string) : Promise<any> {
    let config = await this.cauldron.getConfig(napDescriptor)
    if (!config || !config.hasOwnProperty(key)) {
      config = await this.cauldron.getConfig(napDescriptor.withoutVersion())
      if (!config || !config.hasOwnProperty(key)) {
        config = await this.cauldron.getConfig(new NativeApplicationDescriptor(napDescriptor.name))
      }
    }
    return config ? config[key] : undefined
  }

  async updateNativeAppIsReleased (
    napDescriptor: NativeApplicationDescriptor,
    isReleased: boolean) : Promise<void> {
    return this.cauldron.updateVersion(napDescriptor, {isReleased})
  }

  async updateContainerVersion (
    napDescriptor: NativeApplicationDescriptor,
    containerVersion: string) : Promise<void> {
    await this.cauldron.updateContainerVersion(napDescriptor, containerVersion)
    await this.cauldron.updateTopLevelContainerVersion(napDescriptor, containerVersion)
  }

  async getContainerVersion (
    napDescriptor: NativeApplicationDescriptor) : Promise<string> {
    return this.cauldron.getContainerVersion(napDescriptor)
  }

  async getTopLevelContainerVersion (
    napDescriptor: NativeApplicationDescriptor) : Promise<?string> {
    return this.cauldron.getTopLevelContainerVersion(napDescriptor)
  }

  async updateContainerMiniAppVersion (
    napDescriptor: NativeApplicationDescriptor,
    miniApp: PackagePath) : Promise<void> {
    return this.cauldron.updateContainerMiniAppVersion(napDescriptor, miniApp)
  }

  async throwIfNativeAppVersionIsReleased (
    napDescriptor: NativeApplicationDescriptor,
    errorMessage: string) {
    const nativeAppVersion = await this.cauldron.getVersion(napDescriptor)
    if (nativeAppVersion.isReleased) {
      throw new Error(errorMessage)
    }
  }
}
