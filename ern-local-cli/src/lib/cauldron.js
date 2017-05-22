import {
    config,
    Dependency,
    log,
    platform,
    required,
    spin,
    tagOneLine
} from '@walmart/ern-util'
import _ from 'lodash'
import CauldronCli from '@walmart/ern-cauldron-api'

//
// Helper class to access the cauldron
// It uses the ern-cauldron-cli client
class Cauldron {
  constructor (cauldronRepoAlias) {
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
  async addNativeApp (ernPlatformVersion = platform.currentVersion,
                       appName = required('appName'),
                       platformName,
                       versionName) {
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

  async _createNativeApp (ernPlatformVersion,
                        appName,
                        platformName,
                        versionName) {
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
  async removeNativeApp (appName = required('appName'),
                          platformName,
                          versionName) {
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

  async _removeNativeApp (appName,
                           platformName,
                           versionName) {
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
  async addNativeDependency (dependency = required('dependency'),
                              appName = required('appName'),
                              platformName = required('platformName'),
                              versionName = required('versionName')) {
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
  async removeNativeDependency (dependencyName = required('dependencyName'),
                                 appName = required('appName'),
                                 platformName = required('platformName'),
                                 versionName = required('versionName')) {
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
  async getNativeApp (appName = required('appName'),
                       platformName,
                       versionName) {
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
  async getNativeDependencies (appName = required('appName'),
                                platformName = required('platformName'),
                                versionName = required('versionName'),
                                { convertToObjects = true } = {}) {
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
  async addNativeBinary (binaryPath = required('binaryPath'),
                          appName = required('appName'),
                          platformName = required('platformName'),
                          versionName = required('versionName')) {
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
  async getNativeBinary (appName = required('appName'),
                          platformName = required('platformName'),
                          versionName = required('versionName')) {
    try {
      return this.cauldron.getNativeBinary(
                appName, platformName, versionName)
    } catch (e) {
      log.error(`[getNativeBinary] ${e}`)
      throw e
    }
  }

    // Get a native dependency from the cauldron
  async getNativeDependency (appName, platformName, versionName, depName, { convertToObject = true } = {}) {
    const dependency = await this.cauldron.getNativeDependency(appName, platformName, versionName, depName)
    return convertToObject ? Dependency.fromString(dependency) : dependency
  }

    // Update an existing native dependency version
  async updateNativeAppDependency (appName, platformName, versionName, dependencyName, newVersion) {
    await this.throwIfNativeAppVersionIsReleased(appName, platformName, versionName,
            'Cannot update a native dependency for a released native app version')

    return spin(`Updating dependency ${dependencyName} version to ${newVersion}`,
                this.cauldron.updateNativeDependency(appName, platformName, versionName, dependencyName, newVersion))
  }

  async getAllNativeApps () {
    return this.cauldron.getNativeApplications()
  }

  async getOtaMiniApp (nativeApplicationName, platformName, versionName, miniApp) {
    return this.cauldron.getOtaMiniApp(nativeApplicationName, platformName, versionName, miniApp)
  }

  async getContainerMiniApp (nativeApplicationName, platformName, versionName, miniApp) {
    return this.cauldron.getContainerMiniApp(nativeApplicationName, platformName, versionName, miniApp)
  }

  async getOtaMiniApps (nativeApplicationName, platformName, versionName, {
        convertToObjects = true,
        onlyKeepLatest
    } = {}) {
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

  async getContainerMiniApps (nativeApplicationName, platformName, versionName, { convertToObjects = true } = {}) {
    const miniApps = await this.cauldron.getContainerMiniApps(nativeApplicationName, platformName, versionName)
    return convertToObjects ? _.map(miniApps, Dependency.fromString) : miniApps
  }

  async addOtaMiniApp (nativeApplicationName, platformName, versionName, miniApp) {
    return spin(tagOneLine`Adding ${miniApp.toString()} to
               ${nativeApplicationName}:${platformName}:${versionName} ota`,
            this.cauldron.addOtaMiniApp(nativeApplicationName, platformName, versionName, miniApp))
  }

  async addContainerMiniApp (nativeApplicationName, platformName, versionName, miniApp) {
    return spin(tagOneLine`Adding ${miniApp.toString()} to
               ${nativeApplicationName}:${platformName}:${versionName} container`,
            this.cauldron.addContainerMiniApp(nativeApplicationName, platformName, versionName, miniApp))
  }

  async getConfig (appName, platformName, versionName) {
    let config = await this.cauldron.getConfig({appName, platformName, versionName})
    if (!config) {
      config = await this.cauldron.getConfig({appName, platformName})
      if (!config) {
        config = await this.cauldron.getConfig({appName})
      }
    }
    return config
  }

  async updateNativeAppIsReleased (appName, platformName, versionName, isReleased) {
    return this.cauldron.updateVersion(appName, platformName, versionName, {isReleased})
  }

  async updateMiniAppVersion (appName, platformName, versionName, miniApp) {
    return this.cauldron.updateMiniAppVersion(appName, platformName, versionName, miniApp)
  }

  async throwIfNativeAppVersionIsReleased (appName, platformName, versionName, errorMessage) {
    const nativeAppVersion =
            await this.cauldron.getVersion(appName, platformName, versionName)

    if (nativeAppVersion.isReleased) {
      throw new Error(errorMessage)
    }
  }
}
export default new Cauldron(config.getValue('cauldronRepoInUse'))
