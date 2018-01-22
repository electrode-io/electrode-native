// @flow

import PackagePath from './PackagePath'
import NativeApplicationDescriptor from './NativeApplicationDescriptor'
import * as fileUtils from './fileUtil'
import * as promptUtils from './promptUtils'
import _ from 'lodash'
import type {
  CauldronCodePushMetadata
} from 'ern-cauldron-api'
import Platform from './Platform'

type CodePushVersionModifier = {
  deploymentName: string,
  modifier: string
}

type CodePushConfig = {
  entriesLimit?: number,
  versionModifiers?: Array<CodePushVersionModifier>
}

//
// Helper class to access the cauldron
// It uses the ern-cauldron-cli client
export default class CauldronHelper {
  cauldron: Object

  constructor (cauldronApi: Object) {
    if (!cauldronApi) {
      throw new Error('cauldronApi is required')
    }
    this.cauldron = cauldronApi
  }

  async beginTransaction () {
    return this.cauldron.beginTransaction()
  }

  async discardTransaction () {
    return this.cauldron.discardTransaction()
  }

  async commitTransaction (message: string | Array<string>) {
    return this.cauldron.commitTransaction(message)
  }

  async getCauldronSchemaVersion () {
    return this.cauldron.getCauldronSchemaVersion()
  }

  async upgradeCauldronSchema () {
    return this.cauldron.upgradeCauldronSchema()
  }

  async addNativeApp (
    napDescriptor: NativeApplicationDescriptor,
    ernPlatformVersion: string = Platform.currentVersion) : Promise<*> {
    if (!await this.cauldron.getNativeApplication(napDescriptor.name)) {
      await this.cauldron.createNativeApplication({name: napDescriptor.name})
    }
    if (napDescriptor.platform && !await this.cauldron.getPlatform(napDescriptor.name, napDescriptor.platform)) {
      await this.cauldron.createPlatform(napDescriptor.name, {name: napDescriptor.platform})
    }
    if (napDescriptor.version && !await this.cauldron.getVersion(napDescriptor.name, napDescriptor.platform, napDescriptor.version)) {
      await this.cauldron.createVersion(
        napDescriptor.name, napDescriptor.platform, {name: napDescriptor.version, ernPlatformVersion})
    }
  }

  async removeNativeApp (napDescriptor: NativeApplicationDescriptor) : Promise<*> {
    if (napDescriptor.version) {
      await this.cauldron.removeVersion(
                napDescriptor.name, napDescriptor.platform, napDescriptor.version)
    } else if (napDescriptor.platform) {
      await this.cauldron.removePlatform(napDescriptor.name, napDescriptor.platform)
    } else {
      await this.cauldron.removeNativeApplication(napDescriptor.name)
    }
  }

  async isNativeApplicationInCauldron (napDescriptor: NativeApplicationDescriptor) : Promise<boolean> {
    const nativeApp = await this.getNativeApp(napDescriptor)
    return nativeApp !== undefined
  }

  async addNativeDependency (
    napDescriptor: NativeApplicationDescriptor,
    dependency: PackagePath) : Promise<*> {
    this.throwIfPartialNapDescriptor(napDescriptor)
    await this.throwIfNativeApplicationNotInCauldron(napDescriptor)
    await this.throwIfNativeAppVersionIsReleased(napDescriptor,
      'Cannot add a native dependency to a released native app version')

    return this.cauldron.createNativeDependency(
      napDescriptor.name, napDescriptor.platform, napDescriptor.version, dependency)
  }

  async removeNativeDependency (
    napDescriptor: NativeApplicationDescriptor,
    dependency: PackagePath) : Promise<*> {
    this.throwIfPartialNapDescriptor(napDescriptor)
    await this.throwIfNativeApplicationNotInCauldron(napDescriptor)
    const basePathDependencyString = dependency.basePath
    await this.throwIfNativeAppVersionIsReleased(napDescriptor,
              'Cannot remove a native dependency from a released native app version')

    return this.cauldron.removeNativeDependency(
        napDescriptor.name, napDescriptor.platform, napDescriptor.version, basePathDependencyString)
  }

  async removeMiniAppFromContainer (
    napDescriptor: NativeApplicationDescriptor,
    miniAppName: PackagePath) : Promise<*> {
    this.throwIfPartialNapDescriptor(napDescriptor)
    await this.throwIfNativeApplicationNotInCauldron(napDescriptor)
    const basePathMiniAppString = miniAppName.basePath
    await this.throwIfNativeAppVersionIsReleased(napDescriptor,
    'Cannot remove a MiniApp for a released native app version')
    return this.cauldron.removeContainerMiniApp(
      napDescriptor.name, napDescriptor.platform, napDescriptor.version, basePathMiniAppString)
  }

  async removeJsApiImplFromContainer (
    napDescriptor: NativeApplicationDescriptor,
    jsApiImpl: PackagePath) : Promise<*> {
    this.throwIfPartialNapDescriptor(napDescriptor)
    await this.throwIfNativeAppVersionIsReleased(napDescriptor,
      'Cannot remove a JS API impl from the Container of a released native app version')
    return this.cauldron.removeJsApiImpl(
      napDescriptor.name,
      napDescriptor.platform,
      napDescriptor.version,
      jsApiImpl.basePath)
  }

  async addPublisher (
    publisherType: ('maven' | 'github'),
    url: string,
    napDescriptor: ?NativeApplicationDescriptor) {
    let nativeAppName, platform
    if (napDescriptor) {
      await this.throwIfNativeApplicationNotInCauldron(napDescriptor)
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
    await this.cauldron.addPublisher(nativeAppName, platform, publisherType, url)
  }

  /**
   * Returns all native app names that has configuration for given platform
   * @param givenPlatform
   * @returns {Promise.<Array>}
   */
  async getNativeAppsForPlatform (givenPlatform: string): Promise<Array<string>> {
    const availableNativeApps = await this.getAllNativeApps()
    const nativeAppsForGivenPlatform = []
    if (availableNativeApps) {
      for (const nativeApp of availableNativeApps) {
        for (const platform of nativeApp.platforms) {
          if (platform.name === givenPlatform) {
            nativeAppsForGivenPlatform.push(nativeApp.name)
            break
          }
        }
      }
    }
    return Promise.resolve(nativeAppsForGivenPlatform)
  }

  async getNativeApp (napDescriptor: NativeApplicationDescriptor) : Promise<*> {
    if (napDescriptor.version) {
      return this.cauldron.getVersion(
                  napDescriptor.name, napDescriptor.platform, napDescriptor.version)
    } else if (napDescriptor.platform) {
      return this.cauldron.getPlatform(napDescriptor.name, napDescriptor.platform)
    } else {
      return this.cauldron.getNativeApplication(napDescriptor.name)
    }
  }

  async getVersions (napDescriptor: NativeApplicationDescriptor) : Promise<*> {
    if (!napDescriptor.platform) {
      throw new Error(`[getVersions] platform must be present in the NativeApplicationDesctiptor`)
    }

    return this.cauldron.getVersions(
      napDescriptor.name,
      napDescriptor.platform)
  }

  async getVersionsNames (napDescriptor: NativeApplicationDescriptor) : Promise<Array<string>> {
    const versions = await this.getVersions(napDescriptor)
    return _.map(versions, v => v.name)
  }

  async getNativeDependencies (
    napDescriptor: NativeApplicationDescriptor) : Promise<Array<PackagePath>> {
    this.throwIfPartialNapDescriptor(napDescriptor)
    const dependencies = await this.cauldron.getNativeDependencies(
      napDescriptor.name,
      napDescriptor.platform,
      napDescriptor.version)

    return _.map(dependencies, PackagePath.fromString)
  }

  async hasYarnLock (
    napDescriptor: NativeApplicationDescriptor,
    key: string) : Promise<boolean> {
    this.throwIfPartialNapDescriptor(napDescriptor)
    await this.throwIfNativeApplicationNotInCauldron(napDescriptor)
    return this.cauldron.hasYarnLock(
      napDescriptor.name,
      napDescriptor.platform,
      napDescriptor.version,
      key)
  }

  async addYarnLock (
    napDescriptor: NativeApplicationDescriptor,
    key: string,
    yarnlockPath: string) : Promise<*> {
    this.throwIfPartialNapDescriptor(napDescriptor)
    await this.throwIfNativeApplicationNotInCauldron(napDescriptor)
    let yarnLockFile = await fileUtils.readFile(yarnlockPath)
    return this.cauldron.addYarnLock(
      napDescriptor.name,
      napDescriptor.platform,
      napDescriptor.version,
      key,
      yarnLockFile)
  }

  async getYarnLock (
    napDescriptor: NativeApplicationDescriptor,
    key: string) : Promise<?Buffer> {
    this.throwIfPartialNapDescriptor(napDescriptor)
    await this.throwIfNativeApplicationNotInCauldron(napDescriptor)
    return this.cauldron.getYarnLock(
      napDescriptor.name,
      napDescriptor.platform,
      napDescriptor.version,
      key)
  }

  async getPathToYarnLock (
    napDescriptor: NativeApplicationDescriptor,
    key: string) : Promise<?string> {
    this.throwIfPartialNapDescriptor(napDescriptor)
    await this.throwIfNativeApplicationNotInCauldron(napDescriptor)
    return this.cauldron.getPathToYarnLock(
      napDescriptor.name,
      napDescriptor.platform,
      napDescriptor.version,
      key)
  }

  async removeYarnLock (
    napDescriptor: NativeApplicationDescriptor,
    key: string) : Promise<boolean> {
    this.throwIfPartialNapDescriptor(napDescriptor)
    await this.throwIfNativeApplicationNotInCauldron(napDescriptor)
    return this.cauldron.removeYarnLock(
      napDescriptor.name,
      napDescriptor.platform,
      napDescriptor.version,
      key)
  }

  async updateYarnLock (
    napDescriptor: NativeApplicationDescriptor,
    key: string,
    yarnlockPath: string
  ) : Promise<boolean> {
    this.throwIfPartialNapDescriptor(napDescriptor)
    await this.throwIfNativeApplicationNotInCauldron(napDescriptor)
    let yarnLockFile = await fileUtils.readFile(yarnlockPath)
    return this.cauldron.updateYarnLock(
      napDescriptor.name,
      napDescriptor.platform,
      napDescriptor.version,
      key,
      yarnLockFile)
  }

  async setYarnLocks (
    napDescriptor: NativeApplicationDescriptor,
    yarnLocks: Object
  ) {
    this.throwIfPartialNapDescriptor(napDescriptor)
    await this.throwIfNativeApplicationNotInCauldron(napDescriptor)
    return this.cauldron.setYarnLocks(
      napDescriptor.name,
      napDescriptor.platform,
      napDescriptor.version,
      yarnLocks)
  }

  async addOrUpdateYarnLock (
    napDescriptor: NativeApplicationDescriptor,
    key: string,
    yarnlockPath: string
  ) : Promise<*> {
    this.throwIfPartialNapDescriptor(napDescriptor)
    await this.throwIfNativeApplicationNotInCauldron(napDescriptor)
    if (await this.hasYarnLock(napDescriptor, key)) {
      return this.updateYarnLock(napDescriptor, key, yarnlockPath)
    } else {
      return this.addYarnLock(napDescriptor, key, yarnlockPath)
    }
  }

  async getYarnLockId (
    napDescriptor: NativeApplicationDescriptor,
    key: string
  ) : Promise<?string> {
    this.throwIfPartialNapDescriptor(napDescriptor)
    await this.throwIfNativeApplicationNotInCauldron(napDescriptor)
    return this.cauldron.getYarnLockId(
      napDescriptor.name,
      napDescriptor.platform,
      napDescriptor.version,
      key)
  }

  async setYarnLockId (
    napDescriptor: NativeApplicationDescriptor,
    key: string,
    id: string
  ) {
    this.throwIfPartialNapDescriptor(napDescriptor)
    await this.throwIfNativeApplicationNotInCauldron(napDescriptor)
    return this.cauldron.setYarnLockId(
      napDescriptor.name,
      napDescriptor.platform,
      napDescriptor.version,
      key,
      id)
  }

  async updateYarnLockId (
    napDescriptor: NativeApplicationDescriptor,
    key: string,
    id: string
  ) {
    this.throwIfPartialNapDescriptor(napDescriptor)
    await this.throwIfNativeApplicationNotInCauldron(napDescriptor)
    return this.cauldron.updateYarnLockId(
      napDescriptor.name,
      napDescriptor.platform,
      napDescriptor.version,
      key,
      id)
  }

  async getNativeDependency (
    napDescriptor: NativeApplicationDescriptor,
    dependencyName: string,
    { convertToObject = true } :
    { convertToObject: boolean } = {}) : Promise<?PackagePath> {
    this.throwIfPartialNapDescriptor(napDescriptor)
    await this.throwIfNativeApplicationNotInCauldron(napDescriptor)
    const dependency = await this.cauldron.getNativeDependency(
      napDescriptor.name,
      napDescriptor.platform,
      napDescriptor.version,
      dependencyName)
    if (dependency) {
      return convertToObject ? PackagePath.fromString(dependency) : dependency
    }
  }

  async updateNativeAppDependency (
    napDescriptor: NativeApplicationDescriptor,
    dependencyName: string,
    newVersion: string) : Promise<*> {
    this.throwIfPartialNapDescriptor(napDescriptor)
    await this.throwIfNativeApplicationNotInCauldron(napDescriptor)
    await this.throwIfNativeAppVersionIsReleased(napDescriptor,
      'Cannot update a native dependency for a released native app version')

    return this.cauldron.updateNativeDependency(
        napDescriptor.name,
        napDescriptor.platform,
        napDescriptor.version,
        dependencyName,
        newVersion)
  }

  async updateContainerJsApiImpl (
    napDescriptor: NativeApplicationDescriptor,
    jsApiImplName: string,
    newVersion: string) {
    this.throwIfPartialNapDescriptor(napDescriptor)
    await this.throwIfNativeAppVersionIsReleased(napDescriptor,
      'Cannot update a JS API implementation in the Container of a released native app version')
    return this.cauldron.updateJsApiImpl(
      napDescriptor.name,
      napDescriptor.platform,
      napDescriptor.version,
      jsApiImplName,
      newVersion)
  }

  async getAllNativeApps () : Promise<*> {
    return this.cauldron.getNativeApplications()
  }

  async getContainerJsApiImpls (
    napDescriptor: NativeApplicationDescriptor
  ) : Promise<Array<PackagePath>> {
    this.throwIfPartialNapDescriptor(napDescriptor)
    return this.cauldron.getJsApiImpls(
      napDescriptor.name,
      napDescriptor.platform,
      napDescriptor.version)
  }

  async getContainerJsApiImpl (
    napDescriptor: NativeApplicationDescriptor,
    jsApiImpl: PackagePath) {
    return this.cauldron.getJsApiImpl(
      napDescriptor.name,
      napDescriptor.platform,
      napDescriptor.version,
      jsApiImpl.toString())
  }

  async getCodePushJsApiImpls (
    napDescriptor: NativeApplicationDescriptor,
    deploymentName: string) : Promise<Array<PackagePath> | void> {
    this.throwIfPartialNapDescriptor(napDescriptor)
    await this.throwIfNativeApplicationNotInCauldron(napDescriptor)
    const codePushEntries = await this.cauldron.getCodePushEntries(
      napDescriptor.name,
      napDescriptor.platform,
      napDescriptor.version,
      deploymentName)
    if (codePushEntries) {
      const lastEntry = _.last(codePushEntries)
      return _.map(lastEntry.jsApiImpls, e => PackagePath.fromString(e))
    }
  }

  async getContainerMiniApp (
    napDescriptor: NativeApplicationDescriptor,
    miniApp: string | Object) : Promise<*> {
    this.throwIfPartialNapDescriptor(napDescriptor)
    await this.throwIfNativeApplicationNotInCauldron(napDescriptor)
    return this.cauldron.getContainerMiniApp(
      napDescriptor.name,
      napDescriptor.platform,
      napDescriptor.version,
      miniApp)
  }

  async getCodePushMiniApps (
    napDescriptor: NativeApplicationDescriptor,
    deploymentName: string) : Promise<Array<PackagePath> | void> {
    this.throwIfPartialNapDescriptor(napDescriptor)
    await this.throwIfNativeApplicationNotInCauldron(napDescriptor)
    const codePushEntries = await this.cauldron.getCodePushEntries(
      napDescriptor.name,
      napDescriptor.platform,
      napDescriptor.version,
      deploymentName)
    if (codePushEntries) {
      const lastEntry = _.last(codePushEntries)
      return _.map(lastEntry.miniapps, e => PackagePath.fromString(e))
    }
  }

  async getContainerMiniApps (
    napDescriptor: NativeApplicationDescriptor) : Promise<Array<PackagePath>> {
    try {
      this.throwIfPartialNapDescriptor(napDescriptor)
      await this.throwIfNativeApplicationNotInCauldron(napDescriptor)
      const miniApps = await this.cauldron.getContainerMiniApps(
        napDescriptor.name,
        napDescriptor.platform,
        napDescriptor.version)
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
    jsApiImplementations: Array<PackagePath>) : Promise<*> {
    this.throwIfPartialNapDescriptor(napDescriptor)
    await this.throwIfNativeApplicationNotInCauldron(napDescriptor)
    const miniapps = _.map(miniApps, x => x.toString())
    const jsApiImpls = _.map(jsApiImplementations, x => x.toString())
    const codePushConfig = await this.getCodePushConfig()
    const codePushEntries = await this.cauldron.getCodePushEntries(
      napDescriptor.name,
      napDescriptor.platform,
      napDescriptor.version,
      metadata.deploymentName)
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
      napDescriptor.name,
      napDescriptor.platform,
      napDescriptor.version,
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
    }) : Promise<*> {
    this.throwIfPartialNapDescriptor(napDescriptor)
    await this.throwIfNativeApplicationNotInCauldron(napDescriptor)
    const codePushEntries = await this.cauldron.getCodePushEntries(
      napDescriptor.name,
      napDescriptor.platform,
      napDescriptor.version,
      deploymentName)
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
        napDescriptor.name,
        napDescriptor.platform,
        napDescriptor.version,
        deploymentName,
        codePushEntries)
    }
  }

  async addContainerMiniApp (
    napDescriptor: NativeApplicationDescriptor,
    miniApp: Object) : Promise<*> {
    this.throwIfPartialNapDescriptor(napDescriptor)
    await this.throwIfNativeApplicationNotInCauldron(napDescriptor)
    return this.cauldron.addContainerMiniApp(
            napDescriptor.name,
            napDescriptor.platform,
            napDescriptor.version,
            miniApp)
  }

  async addContainerJsApiImpl (
    napDescriptor: NativeApplicationDescriptor,
    jsApiImpl: PackagePath) : Promise<*> {
    this.throwIfPartialNapDescriptor(napDescriptor)
    return this.cauldron.addJsApiImpl(
      napDescriptor.name,
      napDescriptor.platform,
      napDescriptor.version,
      jsApiImpl)
  }

  async getContainerGeneratorConfig (napDescriptor: NativeApplicationDescriptor) : Promise<*> {
    return this.getConfigForKey(napDescriptor, 'containerGenerator')
  }

  async getManifestConfig () : Promise<*> {
    const config = await this.cauldron.getConfig()
    return config && config.manifest
  }

  async getBinaryStoreConfig () : Promise<*> {
    const config = await this.cauldron.getConfig()
    return config && config.binaryStore
  }

  async getCodePushConfig (descriptor?: NativeApplicationDescriptor) : Promise<CodePushConfig | void> {
    const config = await this.cauldron.getConfig({
      appName: descriptor && descriptor.name,
      platformName: descriptor && descriptor.platform,
      versionName: descriptor && descriptor.version
    })
    return config && config.codePush
  }

  async getConfig (napDescriptor: NativeApplicationDescriptor) : Promise<*> {
    let config = await this.cauldron.getConfig({
      appName: napDescriptor.name,
      platformName: napDescriptor.platform,
      versionName: napDescriptor.version
    })
    if (!config) {
      config = await this.cauldron.getConfig({
        appName: napDescriptor.name,
        platformName: napDescriptor.platform
      })
      if (!config) {
        config = await this.cauldron.getConfig({appName: napDescriptor.name})
      }
    }
    return config
  }

  async getConfigForKey (napDescriptor: NativeApplicationDescriptor, key: string) : Promise<*> {
    let config = await this.cauldron.getConfig({
      appName: napDescriptor.name,
      platformName: napDescriptor.platform,
      versionName: napDescriptor.version
    })
    if (!config || !config.hasOwnProperty(key)) {
      config = await this.cauldron.getConfig({
        appName: napDescriptor.name,
        platformName: napDescriptor.platform
      })
      if (!config || !config.hasOwnProperty(key)) {
        config = await this.cauldron.getConfig({appName: napDescriptor.name})
      }
    }
    return config ? config[key] : undefined
  }

  async updateNativeAppIsReleased (
    napDescriptor: NativeApplicationDescriptor,
    isReleased: boolean) : Promise<*> {
    this.throwIfPartialNapDescriptor(napDescriptor)
    await this.throwIfNativeApplicationNotInCauldron(napDescriptor)
    return this.cauldron.updateVersion(
      napDescriptor.name,
      napDescriptor.platform,
      napDescriptor.version, {isReleased})
  }

  async updateContainerVersion (
    napDescriptor: NativeApplicationDescriptor,
    containerVersion: string) : Promise<*> {
    this.throwIfPartialNapDescriptor(napDescriptor)
    await this.throwIfNativeApplicationNotInCauldron(napDescriptor)
    await this.cauldron.updateContainerVersion(
      napDescriptor.name,
      napDescriptor.platform,
      napDescriptor.version,
      containerVersion)
    await this.cauldron.updateTopLevelContainerVersion(
      napDescriptor.name,
      napDescriptor.platform,
      containerVersion)
  }

  async getContainerVersion (
    napDescriptor: NativeApplicationDescriptor
  ) {
    this.throwIfPartialNapDescriptor(napDescriptor)
    await this.throwIfNativeApplicationNotInCauldron(napDescriptor)
    return this.cauldron.getContainerVersion(
      napDescriptor.name,
      napDescriptor.platform,
      napDescriptor.version)
  }

  async getTopLevelContainerVersion (
    napDescriptor: NativeApplicationDescriptor
  ) {
    return this.cauldron.getTopLevelContainerVersion(
      napDescriptor.name,
      napDescriptor.platform)
  }

  async updateMiniAppVersion (
    napDescriptor: NativeApplicationDescriptor,
    miniApp: PackagePath) : Promise<*> {
    this.throwIfPartialNapDescriptor(napDescriptor)
    return this.cauldron.updateMiniAppVersion(
      napDescriptor.name,
      napDescriptor.platform,
      napDescriptor.version,
      miniApp)
  }

  throwIfPartialNapDescriptor (napDescriptor: NativeApplicationDescriptor) {
    if (napDescriptor.isPartial) {
      throw new Error(`Cannot work with a partial native application descriptor`)
    }
  }

  async throwIfNativeApplicationNotInCauldron (
    napDescriptor: NativeApplicationDescriptor
  ) : Promise<*> {
    if (!await this.isNativeApplicationInCauldron(napDescriptor)) {
      throw new Error(`${napDescriptor.toString()} is not declared in the Cauldron !`)
    }
  }

  async throwIfNativeAppVersionIsReleased (
    napDescriptor: NativeApplicationDescriptor,
    errorMessage: string) : Promise<*> {
    const nativeAppVersion = await this.cauldron.getVersion(
      napDescriptor.name,
      napDescriptor.platform,
      napDescriptor.version)

    if (nativeAppVersion.isReleased) {
      throw new Error(errorMessage)
    }
  }
}
