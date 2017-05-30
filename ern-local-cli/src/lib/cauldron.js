// @flow

import {
    config,
    Dependency,
    log,
    platform,
    spin,
    tagOneLine
} from '@walmart/ern-util'
import _ from 'lodash'
import CauldronCli from '@walmart/ern-cauldron-api'

//
// Helper class to access the cauldron
// It uses the ern-cauldron-cli client
class Cauldron {
  cauldron: Object

  constructor (cauldronRepoAlias: string) {
    if (!cauldronRepoAlias) {
      return console.log('!!! No Cauldron repository currently activated !!!')
    }
    const cauldronRepositories = config.getValue('cauldronRepositories')
    this.cauldron = new CauldronCli(cauldronRepositories[cauldronRepoAlias])
  }

  // Creates a native application in the Cauldron
  // ernPlatformVersion : The version of the platform to use for this native app [REQUIRED]
  // appName : The name of the native application [REQUIRED]
  // platformName : The name of the platform of this application (android or ios)
  // versionName : The name of the version (i.e "4.1" or "4.1-dev-debug" or ...)
  async addNativeApp (ernPlatformVersion: string = platform.currentVersion,
                      appName: string,
                      platformName?: string,
                      versionName?: string) : Promise<*> {
    try {
      return spin(tagOneLine`Adding ${appName} app
          ${versionName ? `at version ${versionName}` : ''}
          ${platformName ? `for ${platformName} platform` : ''}
          to cauldron`,
                this._createNativeApp(
                    ernPlatformVersion,
                    appName,
                    platformName,
                    versionName))
    } catch (e) {
      log.error(`[addNativeApp] ${e}`)
      throw e
    }
  }

  async _createNativeApp (ernPlatformVersion: string,
                          appName: string,
                          platformName?: string,
                          versionName?: string) : Promise<*> {
    await this.cauldron.createNativeApplication({name: appName})
    if (platformName) {
      await this.cauldron.createPlatform(appName, {name: platformName})
      if (versionName) {
        await this.cauldron.createVersion(
                    appName, platformName, {name: versionName, ernPlatformVersion})
      }
    }
  }

  // Removes a native application from the Cauldron
  // appName : The name of the native application [REQUIRED]
  // platformName : The name of the platform of this application (android or ios)
  // versionName : The name of the version (i.e "4.1" or "4.1-dev-debug" or ...)
  async removeNativeApp (appName: string,
                         platformName?: string,
                         versionName?: string) : Promise<*> {
    try {
      return spin(tagOneLine`Removing ${appName} app
          ${versionName ? `at version ${versionName}` : ''}
          ${platformName ? `for ${platformName} platform` : ''}
          from cauldron`,
                this._removeNativeApp(appName, platformName, versionName))
    } catch (e) {
      log.error(`[removeNativeApp] ${e}`)
      throw e
    }
  }

  async _removeNativeApp (appName: string,
                          platformName?: string,
                          versionName?: string) : Promise<*> {
    if (versionName) {
      await this.cauldron.removeVersion(
                appName, platformName, versionName)
    } else if (platformName) {
      await this.cauldron.removePlatform(appName, platformName)
    } else {
      await this.cauldron.removeNativeApplication(appName)
    }
  }

  // Adds a native dependency to the Cauldron
  // dependency : The dependency to add (object) [REQUIRED]
  //   ex : {
  //    name: "react-native-code-push",
  //    version: "1.16.1-beta"
  //   }
  // appName : The name of the native application [REQUIRED]
  // platformName : The name of the platform of this application (android or ios) [REQUIRED]
  // versionName : The name of the version (i.e "4.1" or "4.1-dev-debug" or ...) [REQUIRED]
  async addNativeDependency (dependency: Dependency,
                             appName: string,
                             platformName: string,
                             versionName: string) : Promise<*> {
    try {
      await this.throwIfNativeAppVersionIsReleased(appName, platformName, versionName,
                'Cannot add a native dependency to a released native app version')

      return spin(
                tagOneLine`Adding dependency ${dependency.name}@${dependency.version}
                   to ${appName}:${platformName}:${versionName}`,
                this.cauldron.createNativeDependency(
                    appName, platformName, versionName, dependency.toString()))
    } catch (e) {
      log.error(`[addNativeDependency] ${e}`)
      throw e
    }
  }

  // Removes a native dependency from the Cauldron
  // dependencyName : The name of the dependency to remove [REQUIRED]
  // appName : The name of the native application [REQUIRED]
  // platformName : The name of the platform of this application (android or ios) [REQUIRED]
  // versionName : The name of the version (i.e "4.1" or "4.1-dev-debug" or ...) [REQUIRED]
  async removeNativeDependency (dependencyName: string,
                                appName: string,
                                platformName: string,
                                versionName: string) : Promise<*> {
    try {
      await this.throwIfNativeAppVersionIsReleased(appName, platformName, versionName,
                'Cannot remove a native dependency from a released native app version')

      return spin(
                tagOneLine`Removing dependency ${dependencyName} from
                  ${appName}:${platformName}:${versionName}`,
                this.cauldron.removeNativeDependency(
                    appName, platformName, versionName, dependencyName))
    } catch (e) {
      log.error(`[removeNativeDependency] ${e}`)
      throw e
    }
  }

  // Gets a native app metadata from the Cauldron
  // appName : The name of the app [REQUIRED]
  // platformName : The name of the platform of this application (android or ios) [REQUIRED]
  // versionName : The name of the version (i.e "4.1" or "4.1-dev-debug" or ...) [REQUIRED]
  async getNativeApp (appName: string,
                      platformName: string,
                      versionName: string) : Promise<*> {
    try {
      if (versionName) {
        return this.cauldron.getVersion(
                    appName, platformName, versionName)
      } else if (platformName) {
        return this.cauldron.getPlatform(appName, platformName)
      } else {
        return this.cauldron.getNativeApplication(appName)
      }
    } catch (e) {
      log.error(`[getNativeApp] ${e}`)
      throw e
    }
  }

  // Gets all native dependencies metadata from the Cauldron for a given native app
  // appName : The name of the app [REQUIRED]
  // platformName : The name of the platform of this application (android or ios) [REQUIRED]
  // versionName : The name of the version (i.e "4.1" or "4.1-dev-debug" or ...) [REQUIRED]
  async getNativeDependencies (appName: string,
                               platformName: string,
                               versionName: string,
                               { convertToObjects = true } :
                               { convertToObjects: boolean } = {}) : Promise<*> {
    try {
      const dependencies = await this.cauldron.getNativeDependencies(appName, platformName, versionName)

      return convertToObjects ? _.map(dependencies, Dependency.fromString) : dependencies
    } catch (e) {
      log.error(`[getNativeDependencies] ${e}`)
      throw e
    }
  }

  // Adds a native application binary (APP or APK) to the Cauldron for a given native app
  // binaryPath : Absolute or relative path to the binary [REQUIRED]
  // appName : The name of the app [REQUIRED]
  // platformName : The name of the platform of this application (android or ios) [REQUIRED]
  // versionName : The name of the version (i.e "4.1" or "4.1-dev-debug" or ...) [REQUIRED]
  async addNativeBinary (binaryPath: string,
                         appName: string,
                         platformName: string,
                         versionName: string) : Promise<*> {
    try {
      return this.cauldron.createNativeBinary(
                appName, platformName, versionName, binaryPath)
    } catch (e) {
      log.error(`[addNativeBinary] ${e}`)
      throw e
    }
  }

  // Retrieves a native app binary (APP or APK) from the Cauldron for a given native app
  // appName : The name of the app [REQUIRED]
  // platformName : The name of the platform of this application (android or ios) [REQUIRED]
  // versionName : The name of the version (i.e "4.1" or "4.1-dev-debug" or ...) [REQUIRED]
  async getNativeBinary (appName: string,
                         platformName: string,
                         versionName: string) : Promise<*> {
    try {
      return this.cauldron.getNativeBinary(
                appName, platformName, versionName)
    } catch (e) {
      log.error(`[getNativeBinary] ${e}`)
      throw e
    }
  }

  // Get a native dependency from the cauldron
  async getNativeDependency (appName: string,
                             platformName: string,
                             versionName: string,
                             dependencyName: string,
                             { convertToObject = true } :
                             { convertToObject: boolean } = {}) : Promise<Dependency> {
    const dependency = await this.cauldron.getNativeDependency(appName, platformName, versionName, dependencyName)
    return convertToObject ? Dependency.fromString(dependency) : dependency
  }

  // Update an existing native dependency version
  async updateNativeAppDependency (appName: string,
                                   platformName: string,
                                   versionName: string,
                                   dependencyName: string,
                                   newVersion: string) : Promise<*> {
    await this.throwIfNativeAppVersionIsReleased(appName, platformName, versionName,
            'Cannot update a native dependency for a released native app version')

    return spin(`Updating dependency ${dependencyName} version to ${newVersion}`,
                this.cauldron.updateNativeDependency(appName, platformName, versionName, dependencyName, newVersion))
  }

  async getAllNativeApps () : Promise<*> {
    return this.cauldron.getNativeApplications()
  }

  async getOtaMiniApp (nativeApplicationName: string,
                       platformName: string,
                       versionName: string,
                       miniApp: Object) : Promise<*> {
    return this.cauldron.getOtaMiniApp(nativeApplicationName, platformName, versionName, miniApp)
  }

  async getContainerMiniApp (nativeApplicationName: string,
                             platformName: string,
                             versionName: string,
                             miniApp: Object) : Promise<*> {
    return this.cauldron.getContainerMiniApp(nativeApplicationName, platformName, versionName, miniApp)
  }

  async getOtaMiniApps (nativeApplicationName: string,
                        platformName: string,
                        versionName: string,
                        { convertToObjects = true, onlyKeepLatest } :
                        { convertToObjects: boolean, onlyKeepLatest: boolean } = {}) : Promise<*> {
    let miniApps = await this.cauldron.getOtaMiniApps(nativeApplicationName, platformName, versionName)
    const miniAppsObjects = _.map(miniApps, Dependency.fromString)
        // Could be done in a better way
    if (onlyKeepLatest) {
      let tmp = {}
      for (const miniApp of miniAppsObjects) {
        let currentVersion = tmp[miniApp.withoutVersion().toString()]
        if ((currentVersion && currentVersion < miniApp.version) ||
                    !currentVersion) {
          tmp[miniApp.withoutVersion().toString()] = miniApp.version
        }
      }
      miniApps = []
      for (const miniAppName in tmp) {
        miniApps.push(`${miniAppName}@${tmp[miniAppName]}`)
      }
    }
    return convertToObjects ? _.map(miniApps, Dependency.fromString) : miniApps
  }

  async getContainerMiniApps (nativeApplicationName: string,
                              platformName: string,
                              versionName: string,
                              { convertToObjects = true } :
                              { convertToObjects: boolean } = {}) : Promise<*> {
    const miniApps = await this.cauldron.getContainerMiniApps(nativeApplicationName, platformName, versionName)
    return convertToObjects ? _.map(miniApps, Dependency.fromString) : miniApps
  }

  async addOtaMiniApp (nativeApplicationName: string,
                       platformName: string,
                       versionName: string,
                       miniApp: Object) : Promise<*> {
    return spin(tagOneLine`Adding ${miniApp.toString()} to
               ${nativeApplicationName}:${platformName}:${versionName} ota`,
            this.cauldron.addOtaMiniApp(nativeApplicationName, platformName, versionName, miniApp))
  }

  async addContainerMiniApp (nativeApplicationName: string,
                             platformName: string,
                             versionName: string,
                             miniApp: Object) : Promise<*> {
    return spin(tagOneLine`Adding ${miniApp.toString()} to
               ${nativeApplicationName}:${platformName}:${versionName} container`,
            this.cauldron.addContainerMiniApp(nativeApplicationName, platformName, versionName, miniApp))
  }

  async getConfig (appName: string,
                   platformName: string,
                   versionName: string) : Promise<*> {
    let config = await this.cauldron.getConfig({appName, platformName, versionName})
    if (!config) {
      config = await this.cauldron.getConfig({appName, platformName})
      if (!config) {
        config = await this.cauldron.getConfig({appName})
      }
    }
    return config
  }

  async updateNativeAppIsReleased (appName: string,
                                   platformName: string,
                                   versionName: string,
                                   isReleased: boolean) : Promise<*> {
    return this.cauldron.updateVersion(appName, platformName, versionName, {isReleased})
  }

  async updateMiniAppVersion (appName: string,
                              platformName: string,
                              versionName: string,
                              miniApp: Object) : Promise<*> {
    return this.cauldron.updateMiniAppVersion(appName, platformName, versionName, miniApp)
  }

  async throwIfNativeAppVersionIsReleased (appName: string,
                                           platformName: string,
                                           versionName: string,
                                           errorMessage: string) : Promise<*> {
    const nativeAppVersion =
            await this.cauldron.getVersion(appName, platformName, versionName)

    if (nativeAppVersion.isReleased) {
      throw new Error(errorMessage)
    }
  }
}

export default new Cauldron(config.getValue('cauldronRepoInUse'))
