// @flow

import {
  config,
  Dependency,
  spin,
  tagOneLine,
  NativeApplicationDescriptor,
  fileUtils
} from 'ern-util'
import _ from 'lodash'
import CauldronCli from 'ern-cauldron-api'
import Platform from './Platform'

//
// Helper class to access the cauldron
// It uses the ern-cauldron-cli client
class Cauldron {
  cauldron: Object

  constructor (cauldronRepoAlias: string, cauldronPath: string) {
    if (!cauldronRepoAlias) {
      return console.log('!!! No Cauldron repository currently activated !!!')
    }
    const cauldronRepositories = config.getValue('cauldronRepositories')
    this.cauldron = new CauldronCli(cauldronRepositories[cauldronRepoAlias], cauldronPath)
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

  async commitTransaction () {
    return this.cauldron.commitTransaction()
  }

  async addNativeApp (
    napDescriptor: NativeApplicationDescriptor,
    ernPlatformVersion: string = Platform.currentVersion) : Promise<*> {
    try {
      return spin(tagOneLine`Adding ${napDescriptor.name} app
          ${napDescriptor.version ? `at version ${napDescriptor.version}` : ''}
          ${napDescriptor.platform ? `for ${napDescriptor.platform} platform` : ''}
          to cauldron`,
            this._createNativeApp(napDescriptor, ernPlatformVersion))
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
      return spin(tagOneLine`Removing ${napDescriptor.name} app
          ${napDescriptor.version ? `at version ${napDescriptor.version}` : ''}
          ${napDescriptor.platform ? `for ${napDescriptor.platform} platform` : ''}
          from cauldron`,
              this._removeNativeApp(napDescriptor))
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

      const isInCauldron = await spin(`Checking is ${napDescriptor.toString()} exists in Cauldron`,
        this.isNativeApplicationInCauldron(napDescriptor))

      if (!isInCauldron) {
        return log.error(`${napDescriptor.toString()} does not exist in Cauldron`)
      }

      return spin(tagOneLine`Adding dependency ${dependency.toString()}
        to ${napDescriptor.toString()}`,
        this.cauldron.createNativeDependency(
        napDescriptor.name, napDescriptor.platform, napDescriptor.version, dependency.toString()))
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

      return spin(
                tagOneLine`Removing dependency ${versionLessDependencyString} from
                  ${napDescriptor.toString()}`,
                this.cauldron.removeNativeDependency(
                    napDescriptor.name, napDescriptor.platform, napDescriptor.version, versionLessDependencyString))
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
      return spin(
                tagOneLine`Removing miniApp ${versionLessMiniAppString} from
                  ${napDescriptor.toString()}`,
                this.cauldron.removeContainerMiniApp(napDescriptor.name, napDescriptor.platform, napDescriptor.version, versionLessMiniAppString))
    } catch (e) {
      log.error(`[removeMiniAppFromContainer] ${e}`)
      throw e
    }
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

  async addNativeBinary (
    napDescriptor: NativeApplicationDescriptor,
    binaryPath: string) : Promise<*> {
    try {
      this.throwIfPartialNapDescriptor(napDescriptor)
      await this.throwIfNativeApplicationNotInCauldron(napDescriptor)
      return this.cauldron.createNativeBinary(
                napDescriptor.name, napDescriptor.platform, napDescriptor.version, binaryPath)
    } catch (e) {
      log.error(`[addNativeBinary] ${e}`)
      throw e
    }
  }

  async getNativeBinary (napDescriptor: NativeApplicationDescriptor) : Promise<*> {
    try {
      this.throwIfPartialNapDescriptor(napDescriptor)
      await this.throwIfNativeApplicationNotInCauldron(napDescriptor)
      return this.cauldron.getNativeBinary(
        napDescriptor.name, napDescriptor.platform, napDescriptor.version)
    } catch (e) {
      log.error(`[getNativeBinary] ${e}`)
      throw e
    }
  }

  async hasYarnLock (napDescriptor: NativeApplicationDescriptor) : Promise<boolean> {
    try {
      this.throwIfPartialNapDescriptor(napDescriptor)
      await this.throwIfNativeApplicationNotInCauldron(napDescriptor)
      return this.cauldron.hasYarnLock(
                napDescriptor.name, napDescriptor.platform, napDescriptor.version)
    } catch (e) {
      log.error(`[hasYarnLock] ${e}`)
      throw e
    }
  }

  async addYarnLock (
    napDescriptor: NativeApplicationDescriptor,
    yarnlockPath: string) : Promise<*> {
    try {
      this.throwIfPartialNapDescriptor(napDescriptor)
      await this.throwIfNativeApplicationNotInCauldron(napDescriptor)
      let yarnLockFile = await fileUtils.readFile(yarnlockPath)
      return this.cauldron.addYarnLock(
                napDescriptor.name, napDescriptor.platform, napDescriptor.version, yarnLockFile)
    } catch (e) {
      log.error(`[addYarnLock] ${e}`)
      throw e
    }
  }

  async getYarnLock (napDescriptor: NativeApplicationDescriptor) : Promise<?Buffer> {
    try {
      this.throwIfPartialNapDescriptor(napDescriptor)
      await this.throwIfNativeApplicationNotInCauldron(napDescriptor)
      return this.cauldron.getYarnLock(
                napDescriptor.name, napDescriptor.platform, napDescriptor.version)
    } catch (e) {
      log.error(`[getYarnLock] ${e}`)
      throw e
    }
  }

  async getPathToYarnLock (napDescriptor: NativeApplicationDescriptor) : Promise<?string> {
    try {
      this.throwIfPartialNapDescriptor(napDescriptor)
      await this.throwIfNativeApplicationNotInCauldron(napDescriptor)
      return this.cauldron.getPathToYarnLock(
        napDescriptor.name, napDescriptor.platform, napDescriptor.version
      )
    } catch (e) {
      log.error(`[getPathToYarnLock] ${e}`)
      throw e
    }
  }

  async removeYarnLock (napDescriptor: NativeApplicationDescriptor) : Promise<boolean> {
    try {
      this.throwIfPartialNapDescriptor(napDescriptor)
      await this.throwIfNativeApplicationNotInCauldron(napDescriptor)
      return this.cauldron.removeYarnLock(
                napDescriptor.name, napDescriptor.platform, napDescriptor.version)
    } catch (e) {
      log.error(`[removeYarnLock] ${e}`)
      throw e
    }
  }

  async updateYarnLock (
    napDescriptor: NativeApplicationDescriptor,
    yarnlockPath: string
  ) : Promise<boolean> {
    try {
      this.throwIfPartialNapDescriptor(napDescriptor)
      await this.throwIfNativeApplicationNotInCauldron(napDescriptor)
      let yarnLockFile = await fileUtils.readFile(yarnlockPath)
      return this.cauldron.updateYarnLock(
                napDescriptor.name, napDescriptor.platform, napDescriptor.version, yarnLockFile)
    } catch (e) {
      log.error(`[updateYarnLock] ${e}`)
      throw e
    }
  }

  async setYarnLockId (
    napDescriptor: NativeApplicationDescriptor,
    yarnlockid: string
  ) {
    try {
      this.throwIfPartialNapDescriptor(napDescriptor)
      await this.throwIfNativeApplicationNotInCauldron(napDescriptor)
      return this.cauldron.setYarnLockId(
        napDescriptor.name, napDescriptor.platform, napDescriptor.version, yarnlockid
      )
    } catch (e) {
      log.error(`[setYarnLockId] ${e}`)
      throw e
    }
  }

  async addOrUpdateYarnLock (
    napDescriptor: NativeApplicationDescriptor,
    yarnlockPath: string
  ) : Promise<*> {
    try {
      this.throwIfPartialNapDescriptor(napDescriptor)
      await this.throwIfNativeApplicationNotInCauldron(napDescriptor)
      if (await this.hasYarnLock(napDescriptor)) {
        return this.updateYarnLock(napDescriptor, yarnlockPath)
      } else {
        return this.addYarnLock(napDescriptor, yarnlockPath)
      }
    } catch (e) {
      log.error(`[addOrUpdateYarnLock] ${e}`)
      throw e
    }
  }

  async getNativeDependency (
    napDescriptor: NativeApplicationDescriptor,
    dependencyName: string,
    { convertToObject = true } :
    { convertToObject: boolean } = {}) : Promise<Dependency> {
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

      return spin(`Updating dependency ${dependencyName} version to ${newVersion}`,
        this.cauldron.updateNativeDependency(
          napDescriptor.name,
          napDescriptor.platform,
          napDescriptor.version,
          dependencyName,
          newVersion))
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
    miniApp: Object) : Promise<*> {
    try {
      this.throwIfPartialNapDescriptor(napDescriptor)
      await this.throwIfNativeApplicationNotInCauldron(napDescriptor)
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

  async getCodePushMiniApps (napDescriptor: NativeApplicationDescriptor) : Promise<Array<Array<string>>> {
    try {
      this.throwIfPartialNapDescriptor(napDescriptor)
      await this.throwIfNativeApplicationNotInCauldron(napDescriptor)
      return this.cauldron.getCodePushMiniApps(
        napDescriptor.name,
        napDescriptor.platform,
        napDescriptor.version)
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

  async addCodePushMiniApps (
    napDescriptor: NativeApplicationDescriptor,
    miniApps: Array<Dependency>) : Promise<*> {
    try {
      this.throwIfPartialNapDescriptor(napDescriptor)
      await this.throwIfNativeApplicationNotInCauldron(napDescriptor)
      const miniAppsAsStrings = _.map(miniApps, x => x.toString())
      return spin(tagOneLine`Adding miniapps to
               ${napDescriptor.toString()} codePush`,
            this.cauldron.addCodePushMiniApps(
              napDescriptor.name,
              napDescriptor.platform,
              napDescriptor.version,
              miniAppsAsStrings))
    } catch (e) {
      log.error(`[addOtaMiniApp] ${e}`)
      throw e
    }
  }

  async addContainerMiniApp (
    napDescriptor: NativeApplicationDescriptor,
    miniApp: Object) : Promise<*> {
    try {
      this.throwIfPartialNapDescriptor(napDescriptor)
      await this.throwIfNativeApplicationNotInCauldron(napDescriptor)
      return spin(tagOneLine`Adding ${miniApp.toString()} to
               ${napDescriptor.toString()} container`,
            this.cauldron.addContainerMiniApp(
              napDescriptor.name,
              napDescriptor.platform,
              napDescriptor.version,
              miniApp))
    } catch (e) {
      log.error(`[addContainerMiniApp] ${e}`)
      throw e
    }
  }

  async getContainerGeneratorConfig (napDescriptor: NativeApplicationDescriptor) : Promise<*> {
    let config = await this.cauldron.getConfig({
      appName: napDescriptor.name,
      platformName: napDescriptor.platform
    })
    if (config) {
      return _.get(config, 'containerGenerator') || null
    }
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
      return this.cauldron.updateContainerVersion(
        napDescriptor.name,
        napDescriptor.platform,
        napDescriptor.version,
        containerVersion
      )
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

  async getManifest () {
    if (this.cauldron) {
      return this.cauldron.getManifest()
    }
  }

  async addTargetJsDependencyToManifest (dependency: Dependency) {
    return this.cauldron.addTargetJsDependencyToManifest(dependency)
  }

  async addTargetNativeDependencyToManifest (dependency: Dependency) {
    return this.cauldron.addTargetNativeDependencyToManifest(dependency)
  }

  async updateTargetDependencyVersionInManifest (dependency: Dependency) {
    return this.cauldron.updateTargetDependencyVersionInManifest(dependency)
  }

  async updateTargetJsDependencyVersionInManifest (dependency: Dependency) {
    return this.cauldron.updateTargetJsDependencyVersionInManifest(dependency)
  }

  async updateTargetNativeDependencyVersionInManifest (dependency: Dependency) {
    return this.cauldron.updateTargetNativeDependencyVersionInManifest(dependency)
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

export default new Cauldron(config.getValue('cauldronRepoInUse'), `${Platform.rootDirectory}/cauldron`)
