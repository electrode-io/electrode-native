// @flow

import {
  Dependency,
  NativeApplicationDescriptor,
  fileUtils,
  promptUtils
} from 'ern-util'
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

  constructor (cauldronCli?: Object) {
    if (!cauldronCli) {
      return
    }
    this.cauldron = cauldronCli
  }

  isActive () {
    return this.cauldron !== undefined
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

  async addNativeApp (
    napDescriptor: NativeApplicationDescriptor,
    ernPlatformVersion: string = Platform.currentVersion) : Promise<*> {
    try {
      return this._createNativeApp(napDescriptor, ernPlatformVersion)
    } catch (e) {
      log.error(`[addNativeApp] ${e}`)
      throw e
    }
  }

  async _createNativeApp (
    napDescriptor: NativeApplicationDescriptor,
    ernPlatformVersion: string) : Promise<*> {
    await this.cauldron.createNativeApplication({name: napDescriptor.name})
    if (napDescriptor.platform) {
      await this.cauldron.createPlatform(napDescriptor.name, {name: napDescriptor.platform})
      if (napDescriptor.version) {
        await this.cauldron.createVersion(
                    napDescriptor.name, napDescriptor.platform, {name: napDescriptor.version, ernPlatformVersion})
      }
    }
  }

  async removeNativeApp (napDescriptor: NativeApplicationDescriptor) : Promise<*> {
    try {
      return this._removeNativeApp(napDescriptor)
    } catch (e) {
      log.error(`[removeNativeApp] ${e}`)
      throw e
    }
  }

  async _removeNativeApp (napDescriptor: NativeApplicationDescriptor) : Promise<*> {
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
    dependency: Dependency) : Promise<*> {
    try {
      this.throwIfPartialNapDescriptor(napDescriptor)
      await this.throwIfNativeApplicationNotInCauldron(napDescriptor)
      await this.throwIfNativeAppVersionIsReleased(napDescriptor,
        'Cannot add a native dependency to a released native app version')

      const isInCauldron = await this.isNativeApplicationInCauldron(napDescriptor)

      if (!isInCauldron) {
        return log.error(`${napDescriptor.toString()} does not exist in Cauldron`)
      }

      return this.cauldron.createNativeDependency(
        napDescriptor.name, napDescriptor.platform, napDescriptor.version, dependency.toString())
    } catch (e) {
      log.error(`[addNativeDependency] ${e}`)
      throw e
    }
  }

  async removeNativeDependency (
    napDescriptor: NativeApplicationDescriptor,
    dependency: Dependency) : Promise<*> {
    try {
      this.throwIfPartialNapDescriptor(napDescriptor)
      await this.throwIfNativeApplicationNotInCauldron(napDescriptor)
      const versionLessDependencyString = dependency.withoutVersion().toString()
      await this.throwIfNativeAppVersionIsReleased(napDescriptor,
                'Cannot remove a native dependency from a released native app version')

      return this.cauldron.removeNativeDependency(
          napDescriptor.name, napDescriptor.platform, napDescriptor.version, versionLessDependencyString)
    } catch (e) {
      log.error(`[removeNativeDependency] ${e}`)
      throw e
    }
  }

  async removeMiniAppFromContainer (
    napDescriptor: NativeApplicationDescriptor,
    miniAppName: Dependency) : Promise<*> {
    try {
      this.throwIfPartialNapDescriptor(napDescriptor)
      await this.throwIfNativeApplicationNotInCauldron(napDescriptor)
      const versionLessMiniAppString = miniAppName.withoutVersion().toString()
      await this.throwIfNativeAppVersionIsReleased(napDescriptor,
      'Cannot remove a MiniApp for a released native app version')
      return this.cauldron.removeContainerMiniApp(
        napDescriptor.name, napDescriptor.platform, napDescriptor.version, versionLessMiniAppString)
    } catch (e) {
      log.error(`[removeMiniAppFromContainer] ${e}`)
      throw e
    }
  }

  async addPublisher (napDescriptor: ?NativeApplicationDescriptor, publisherType: ('maven' | 'github'), url: string) {
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
    try {
      if (napDescriptor.version) {
        return this.cauldron.getVersion(
                    napDescriptor.name, napDescriptor.platform, napDescriptor.version)
      } else if (napDescriptor.platform) {
        return this.cauldron.getPlatform(napDescriptor.name, napDescriptor.platform)
      } else {
        return this.cauldron.getNativeApplication(napDescriptor.name)
      }
    } catch (e) {
      log.error(`[getNativeApp] ${e}`)
      throw e
    }
  }

  async getVersions (napDescriptor: NativeApplicationDescriptor) : Promise<*> {
    if (!napDescriptor.platform) {
      throw new Error(`[getVersions] platform must be present in the NativeApplicationDesctiptor`)
    }

    return this.cauldron.getVersions(
      napDescriptor.name,
      napDescriptor.version)
  }

  async getVersionsNames (napDescriptor: NativeApplicationDescriptor) : Promise<Array<string>> {
    const versions = await this.getVersions(napDescriptor)
    return _.map(versions, v => v.name)
  }

  async getNativeDependencies (
    napDescriptor: NativeApplicationDescriptor) : Promise<Array<Dependency>> {
    try {
      this.throwIfPartialNapDescriptor(napDescriptor)
      const dependencies = await this.cauldron.getNativeDependencies(
        napDescriptor.name,
        napDescriptor.platform,
        napDescriptor.version)

      return _.map(dependencies, Dependency.fromString)
    } catch (e) {
      log.error(`[getNativeDependencies] ${e}`)
      throw e
    }
  }

  async hasYarnLock (
    napDescriptor: NativeApplicationDescriptor,
    key: string) : Promise<boolean> {
    try {
      this.throwIfPartialNapDescriptor(napDescriptor)
      await this.throwIfNativeApplicationNotInCauldron(napDescriptor)
      return this.cauldron.hasYarnLock(
        napDescriptor.name,
        napDescriptor.platform,
        napDescriptor.version,
        key)
    } catch (e) {
      log.error(`[hasYarnLock] ${e}`)
      throw e
    }
  }

  async addYarnLock (
    napDescriptor: NativeApplicationDescriptor,
    key: string,
    yarnlockPath: string) : Promise<*> {
    try {
      this.throwIfPartialNapDescriptor(napDescriptor)
      await this.throwIfNativeApplicationNotInCauldron(napDescriptor)
      let yarnLockFile = await fileUtils.readFile(yarnlockPath)
      return this.cauldron.addYarnLock(
        napDescriptor.name,
        napDescriptor.platform,
        napDescriptor.version,
        key,
        yarnLockFile)
    } catch (e) {
      log.error(`[addYarnLock] ${e}`)
      throw e
    }
  }

  async getYarnLock (
    napDescriptor: NativeApplicationDescriptor,
    key: string) : Promise<?Buffer> {
    try {
      this.throwIfPartialNapDescriptor(napDescriptor)
      await this.throwIfNativeApplicationNotInCauldron(napDescriptor)
      return this.cauldron.getYarnLock(
        napDescriptor.name,
        napDescriptor.platform,
        napDescriptor.version,
        key)
    } catch (e) {
      log.error(`[getYarnLock] ${e}`)
      throw e
    }
  }

  async getPathToYarnLock (
    napDescriptor: NativeApplicationDescriptor,
    key: string) : Promise<?string> {
    try {
      this.throwIfPartialNapDescriptor(napDescriptor)
      await this.throwIfNativeApplicationNotInCauldron(napDescriptor)
      return this.cauldron.getPathToYarnLock(
        napDescriptor.name,
        napDescriptor.platform,
        napDescriptor.version,
        key
      )
    } catch (e) {
      log.error(`[getPathToYarnLock] ${e}`)
      throw e
    }
  }

  async removeYarnLock (
    napDescriptor: NativeApplicationDescriptor,
    key: string) : Promise<boolean> {
    try {
      this.throwIfPartialNapDescriptor(napDescriptor)
      await this.throwIfNativeApplicationNotInCauldron(napDescriptor)
      return this.cauldron.removeYarnLock(
        napDescriptor.name,
        napDescriptor.platform,
        napDescriptor.version,
        key)
    } catch (e) {
      log.error(`[removeYarnLock] ${e}`)
      throw e
    }
  }

  async updateYarnLock (
    napDescriptor: NativeApplicationDescriptor,
    key: string,
    yarnlockPath: string
  ) : Promise<boolean> {
    try {
      this.throwIfPartialNapDescriptor(napDescriptor)
      await this.throwIfNativeApplicationNotInCauldron(napDescriptor)
      let yarnLockFile = await fileUtils.readFile(yarnlockPath)
      return this.cauldron.updateYarnLock(
        napDescriptor.name,
        napDescriptor.platform,
        napDescriptor.version,
        key,
        yarnLockFile)
    } catch (e) {
      log.error(`[updateYarnLock] ${e}`)
      throw e
    }
  }

  async setYarnLocks (
    napDescriptor: NativeApplicationDescriptor,
    yarnLocks: Object
  ) {
    try {
      this.throwIfPartialNapDescriptor(napDescriptor)
      await this.throwIfNativeApplicationNotInCauldron(napDescriptor)
      return this.cauldron.setYarnLocks(
        napDescriptor.name,
        napDescriptor.platform,
        napDescriptor.version,
        yarnLocks)
    } catch (e) {
      log.error(`[setYarnLocks] ${e}`)
      throw e
    }
  }

  async addOrUpdateYarnLock (
    napDescriptor: NativeApplicationDescriptor,
    key: string,
    yarnlockPath: string
  ) : Promise<*> {
    try {
      this.throwIfPartialNapDescriptor(napDescriptor)
      await this.throwIfNativeApplicationNotInCauldron(napDescriptor)
      if (await this.hasYarnLock(napDescriptor, key)) {
        return this.updateYarnLock(napDescriptor, key, yarnlockPath)
      } else {
        return this.addYarnLock(napDescriptor, key, yarnlockPath)
      }
    } catch (e) {
      log.error(`[addOrUpdateYarnLock] ${e}`)
      throw e
    }
  }

  async getYarnLockId (
    napDescriptor: NativeApplicationDescriptor,
    key: string
  ) : Promise<?string> {
    try {
      this.throwIfPartialNapDescriptor(napDescriptor)
      await this.throwIfNativeApplicationNotInCauldron(napDescriptor)
      return this.cauldron.getYarnLockId(
        napDescriptor.name,
        napDescriptor.platform,
        napDescriptor.version,
        key)
    } catch (e) {
      log.error(`[getYarnLockId] ${e}`)
      throw e
    }
  }

  async setYarnLockId (
    napDescriptor: NativeApplicationDescriptor,
    key: string,
    id: string
  ) {
    try {
      this.throwIfPartialNapDescriptor(napDescriptor)
      await this.throwIfNativeApplicationNotInCauldron(napDescriptor)
      return this.cauldron.setYarnLockId(
        napDescriptor.name,
        napDescriptor.platform,
        napDescriptor.version,
        key,
        id)
    } catch (e) {
      log.error(`[setYarnLockId] ${e}`)
      throw e
    }
  }

  async updateYarnLockId (
    napDescriptor: NativeApplicationDescriptor,
    key: string,
    id: string
  ) {
    try {
      this.throwIfPartialNapDescriptor(napDescriptor)
      await this.throwIfNativeApplicationNotInCauldron(napDescriptor)
      return this.cauldron.updateYarnLockId(
        napDescriptor.name,
        napDescriptor.platform,
        napDescriptor.version,
        key,
        id
      )
    } catch (e) {
      log.error(`[updateYarnLockId] ${e}`)
      throw e
    }
  }

  async getNativeDependency (
    napDescriptor: NativeApplicationDescriptor,
    dependencyName: string,
    { convertToObject = true } :
    { convertToObject: boolean } = {}) : Promise<?Dependency> {
    try {
      this.throwIfPartialNapDescriptor(napDescriptor)
      await this.throwIfNativeApplicationNotInCauldron(napDescriptor)
      const dependency = await this.cauldron.getNativeDependency(
        napDescriptor.name,
        napDescriptor.platform,
        napDescriptor.version,
        dependencyName)
      if (dependency) {
        return convertToObject ? Dependency.fromString(dependency) : dependency
      }
    } catch (e) {
      log.error(`[getNativeDependency] ${e}`)
      throw e
    }
  }

  async updateNativeAppDependency (
    napDescriptor: NativeApplicationDescriptor,
    dependencyName: string,
    newVersion: string) : Promise<*> {
    try {
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
    } catch (e) {
      log.error(`[updateNativeAppDependency] ${e}`)
      throw e
    }
  }

  async getAllNativeApps () : Promise<*> {
    return this.cauldron.getNativeApplications()
  }

  async getContainerMiniApp (
    napDescriptor: NativeApplicationDescriptor,
    miniApp: string | Object) : Promise<*> {
    try {
      this.throwIfPartialNapDescriptor(napDescriptor)
      return this.cauldron.getContainerMiniApp(
        napDescriptor.name,
        napDescriptor.platform,
        napDescriptor.version,
        miniApp)
    } catch (e) {
      log.error(`[getContainerMiniApp] ${e}`)
      throw e
    }
  }

  async getCodePushMiniApps (
    napDescriptor: NativeApplicationDescriptor,
    deploymentName: string) : Promise<Array<Dependency> | void> {
    try {
      this.throwIfPartialNapDescriptor(napDescriptor)
      await this.throwIfNativeApplicationNotInCauldron(napDescriptor)
      const codePushEntries = await this.cauldron.getCodePushEntries(
        napDescriptor.name,
        napDescriptor.platform,
        napDescriptor.version,
        deploymentName)
      if (codePushEntries) {
        const lastEntry = _.last(codePushEntries)
        return _.map(lastEntry.miniapps, e => Dependency.fromString(e))
      }
    } catch (e) {
      log.error(`[getCodePushMiniApps] ${e}`)
      throw e
    }
  }

  async getContainerMiniApps (
    napDescriptor: NativeApplicationDescriptor) : Promise<Array<Dependency>> {
    try {
      this.throwIfPartialNapDescriptor(napDescriptor)
      await this.throwIfNativeApplicationNotInCauldron(napDescriptor)
      const miniApps = await this.cauldron.getContainerMiniApps(
        napDescriptor.name,
        napDescriptor.platform,
        napDescriptor.version)
      return _.map(miniApps, Dependency.fromString)
    } catch (e) {
      log.error(`[getContainerMiniApps] ${e}`)
      throw e
    }
  }

  async addCodePushEntry (
    napDescriptor: NativeApplicationDescriptor,
    metadata: CauldronCodePushMetadata,
    miniApps: Array<Dependency>) : Promise<*> {
    this.throwIfPartialNapDescriptor(napDescriptor)
    await this.throwIfNativeApplicationNotInCauldron(napDescriptor)
    return this._addCodePushEntry(
      napDescriptor,
      metadata,
      miniApps)
  }

  async _addCodePushEntry (
    napDescriptor: NativeApplicationDescriptor,
    metadata: CauldronCodePushMetadata,
    miniApps: Array<Dependency>
  ) : Promise<*> {
    try {
      const miniapps = _.map(miniApps, x => x.toString())
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
        updatedEntriesArr.push({ metadata, miniapps })
      } else {
        updatedEntriesArr = [ { metadata, miniapps } ]
      }

      return this.cauldron.setCodePushEntries(
        napDescriptor.name,
        napDescriptor.platform,
        napDescriptor.version,
        metadata.deploymentName,
        updatedEntriesArr)
    } catch (e) {
      log.error(`[_addCodePushEntry] ${e}`)
      throw e
    }
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
    return this._updateCodePushEntry(
      napDescriptor,
      deploymentName,
      label, {
        isDisabled,
        isMandatory,
        rollout
      })
  }

  async _updateCodePushEntry (
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
    }) {
    try {
      const codePushEntries = await this.cauldron.getCodePushEntries(
        napDescriptor.name,
        napDescriptor.platform,
        napDescriptor.version,
        deploymentName)
      let entry = _.find(codePushEntries, c => c.metadata.label === label)
      if (entry) {
        if (isDisabled !== undefined) {
          entry.metadata.isDisabled = isDisabled
        }
        if (isMandatory !== undefined) {
          entry.metadata.isMandatory = isDisabled
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
    } catch (e) {
      log.error(`[updateCodePushEntry] ${e}`)
      throw e
    }
  }

  async addContainerMiniApp (
    napDescriptor: NativeApplicationDescriptor,
    miniApp: Object) : Promise<*> {
    try {
      this.throwIfPartialNapDescriptor(napDescriptor)
      await this.throwIfNativeApplicationNotInCauldron(napDescriptor)
      return this.cauldron.addContainerMiniApp(
              napDescriptor.name,
              napDescriptor.platform,
              napDescriptor.version,
              miniApp)
    } catch (e) {
      log.error(`[addContainerMiniApp] ${e}`)
      throw e
    }
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
    if (!config || !config[key]) {
      config = await this.cauldron.getConfig({
        appName: napDescriptor.name,
        platformName: napDescriptor.platform
      })
      if (!config || !config[key]) {
        config = await this.cauldron.getConfig({appName: napDescriptor.name})
      }
    }
    return config ? config.key : undefined
  }

  async updateNativeAppIsReleased (
    napDescriptor: NativeApplicationDescriptor,
    isReleased: boolean) : Promise<*> {
    try {
      this.throwIfPartialNapDescriptor(napDescriptor)
      return this.cauldron.updateVersion(
        napDescriptor.name,
        napDescriptor.platform,
        napDescriptor.version, {isReleased})
    } catch (e) {
      log.error(`[updateNativeAppIsReleased] ${e}`)
      throw e
    }
  }

  async updateContainerVersion (
    napDescriptor: NativeApplicationDescriptor,
    containerVersion: string) : Promise<*> {
    try {
      this.throwIfPartialNapDescriptor(napDescriptor)
      await this.cauldron.updateContainerVersion(
        napDescriptor.name,
        napDescriptor.platform,
        napDescriptor.version,
        containerVersion)
      await this.cauldron.updateTopLevelContainerVersion(
        napDescriptor.name,
        napDescriptor.platform,
        containerVersion)
    } catch (e) {
      log.error(`[updateContainerVersion] ${e}`)
      throw e
    }
  }

  async getContainerVersion (
    napDescriptor: NativeApplicationDescriptor
  ) {
    try {
      this.throwIfPartialNapDescriptor(napDescriptor)
      return this.cauldron.getContainerVersion(
        napDescriptor.name,
        napDescriptor.platform,
        napDescriptor.version
      )
    } catch (e) {
      log.error(`[getContainerVersion] ${e}`)
      throw e
    }
  }

  async getTopLevelContainerVersion (
    napDescriptor: NativeApplicationDescriptor
  ) {
    try {
      return this.cauldron.getTopLevelContainerVersion(
        napDescriptor.name,
        napDescriptor.platform
      )
    } catch (e) {
      log.error(`[getTopLevelContainerVersion] ${e}`)
      throw e
    }
  }

  async updateMiniAppVersion (
    napDescriptor: NativeApplicationDescriptor,
    miniApp: Object) : Promise<*> {
    try {
      this.throwIfPartialNapDescriptor(napDescriptor)
      return this.cauldron.updateMiniAppVersion(
        napDescriptor.name,
        napDescriptor.platform,
        napDescriptor.version,
        miniApp)
    } catch (e) {
      log.error(`[updateMiniAppVersion] ${e}`)
      throw e
    }
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
