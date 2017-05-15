import CauldronCli from '@walmart/ern-cauldron-api';
import required from './required';
import spin from './spin';
import platform from './platform';
import tagOneLine from './tagoneline';
import config from './config';
import log from './log';
import _ from 'lodash';

//
// Helper class to access the cauldron
// It uses the ern-cauldron-cli client
class Cauldron {

    constructor(cauldronRepoAlias) {
        if (!cauldronRepoAlias) {
            return console.log('!!! No Cauldron repository currently activated !!!')
        }
        const cauldronRepositories = config.getValue('cauldronRepositories')
        this.cauldron = new CauldronCli(cauldronRepositories[cauldronRepoAlias]);
    }

    dependencyObjToString(dependencyObj) {
        return tagOneLine`${dependencyObj.scope ? `@${dependencyObj.scope}/` : ''}
                          ${dependencyObj.name}
                          ${dependencyObj.version ? `@${dependencyObj.version}` : ''}`.replace(/\s/g, '')
    }

    dependencyStringToObj(dependencyString) {
        if (!dependencyString) { return }

        const scopedModuleWithVersionRe = /@(.+)\/(.+)@(.+)/;
        const unscopedModuleWithVersionRe = /(.+)@(.+)/;
        const scopedModuleWithoutVersionRe = /@(.+)\/(.+)/;

        if (scopedModuleWithVersionRe.test(dependencyString)) {
            return {
                scope: scopedModuleWithVersionRe.exec(dependencyString)[1],
                name: scopedModuleWithVersionRe.exec(dependencyString)[2],
                version: scopedModuleWithVersionRe.exec(dependencyString)[3]
            }
        } else if (unscopedModuleWithVersionRe.test(dependencyString)) {
            return {
                name: unscopedModuleWithVersionRe.exec(dependencyString)[1],
                version: unscopedModuleWithVersionRe.exec(dependencyString)[2]
            }
        } else if (scopedModuleWithoutVersionRe.test(dependencyString)) {
            return {
                scope: scopedModuleWithoutVersionRe.exec(dependencyString)[1],
                name: scopedModuleWithoutVersionRe.exec(dependencyString)[2]
            }
        } else {
            return { name: dependencyString }
        } 
    }
    ///

    // Creates a native application in the Cauldron
    // ernPlatformVersion : The version of the platform to use for this native app [REQUIRED]
    // appName : The name of the native application [REQUIRED]
    // platformName : The name of the platform of this application (android or ios)
    // versionName : The name of the version (i.e "4.1" or "4.1-dev-debug" or ...)
    async addNativeApp(ernPlatformVersion = platform.currentVersion,
                       appName,
                       platformName,
                       versionName) {
        try {
            required(appName, 'appName');

            return spin(tagOneLine`Adding ${appName} app
          ${versionName ? `at version ${versionName}` : ''}
          ${platformName ? `for ${platformName} platform` : ''}
          to cauldron`,
                this._createNativeApp(
                    ernPlatformVersion,
                    appName,
                    platformName,
                    versionName));
        } catch (e) {
            log.error(`[addNativeApp] ${e}`);
            throw e;
        }
    }

    async _createNativeApp(ernPlatformVersion,
                        appName,
                        platformName,
                        versionName) {
        await this.cauldron.createNativeApplication({name: appName});
        if (platformName) {
            await this.cauldron.createPlatform(appName, {name: platformName});
            if (versionName) {
                await this.cauldron.createVersion(
                    appName, platformName, {name: versionName, ernPlatformVersion});
            }
        }
    }

    // Removes a native application from the Cauldron
    // appName : The name of the native application [REQUIRED]
    // platformName : The name of the platform of this application (android or ios)
    // versionName : The name of the version (i.e "4.1" or "4.1-dev-debug" or ...)
    async removeNativeApp(appName,
                          platformName,
                          versionName) {
        try {
            required(appName, 'appName');

            return spin(tagOneLine`Removing ${appName} app
          ${versionName ? `at version ${versionName}` : ''}
          ${platformName ? `for ${platformName} platform` : ''}
          from cauldron`,
                this._removeNativeApp(appName, platformName, versionName))
        } catch (e) {
            log.error(`[removeNativeApp] ${e}`);
            throw e;
        }
    }

    async _removeNativeApp(appName,
                           platformName,
                           versionName) {
        if (versionName) {
            await this.cauldron.removeVersion(
                appName, platformName, versionName);
        } else if (platformName) {
            await this.cauldron.removePlatform(appName, platformName);
        } else {
            await this.cauldron.removeNativeApplication(appName);
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
    async addNativeDependency(dependency,
                              appName,
                              platformName,
                              versionName) {
        try {
            required(dependency, 'dependency');
            required(appName, 'appName');
            required(platformName, 'platformName');
            required(versionName, 'versionName');

            await this.throwIfNativeAppVersionIsReleased(appName, platformName, versionName,
                'Cannot add a native dependency to a released native app version')

            return spin(
                tagOneLine`Adding dependency ${dependency.name}@${dependency.version}
                   to ${appName}:${platformName}:${versionName}`,
                this.cauldron.createNativeDependency(
                    appName, platformName, versionName, this.dependencyObjToString(dependency)));
        } catch (e) {
            log.error(`[addNativeDependency] ${e}`);
            throw e;
        }
    }

    // Removes a native dependency from the Cauldron
    // dependencyName : The name of the dependency to remove [REQUIRED]
    // appName : The name of the native application [REQUIRED]
    // platformName : The name of the platform of this application (android or ios) [REQUIRED]
    // versionName : The name of the version (i.e "4.1" or "4.1-dev-debug" or ...) [REQUIRED]
    async removeNativeDependency(dependencyName,
                                 appName,
                                 platformName,
                                 versionName) {
        try {
            required(dependencyName, 'dependencyName');
            required(appName, 'appName');
            required(platformName, 'platformName');
            required(versionName, 'versionName');

            await this.throwIfNativeAppVersionIsReleased(appName, platformName, versionName,
                'Cannot remove a native dependency from a released native app version')

            return spin(
                tagOneLine`Removing dependency ${dependencyName} from
                  ${appName}:${platformName}:${versionName}`,
                this.cauldron.removeNativeDependency(
                    appName, platformName, versionName, dependencyName));
        } catch (e) {
            log.error(`[removeNativeDependency] ${e}`);
            throw e;
        }
    }

    // Gets a native app metadata from the Cauldron
    // appName : The name of the app [REQUIRED]
    // platformName : The name of the platform of this application (android or ios) [REQUIRED]
    // versionName : The name of the version (i.e "4.1" or "4.1-dev-debug" or ...) [REQUIRED]
    async getNativeApp(appName,
                       platformName,
                       versionName) {
        try {
            required(appName, 'appName');

            if (versionName) {
                return this.cauldron.getVersion(
                    appName, platformName, versionName);
            } else if (platformName) {
                return this.cauldron.getPlatform(appName, platformName);
            } else {
                return this.cauldron.getNativeApplication(appName);
            }
        } catch (e) {
            log.error(`[getNativeApp] ${e}`);
            throw e;
        }
    }

    // Gets all native dependencies metadata from the Cauldron for a given native app
    // appName : The name of the app [REQUIRED]
    // platformName : The name of the platform of this application (android or ios) [REQUIRED]
    // versionName : The name of the version (i.e "4.1" or "4.1-dev-debug" or ...) [REQUIRED]
    async getNativeDependencies(appName,
                                platformName,
                                versionName,
                                { convertToObjects=true } = {}) {
        try {
            required(appName, 'appName');
            required(platformName, 'platformName');
            required(versionName, 'versionName');
            
            const dependencies = await this.cauldron.getNativeDependencies(appName, platformName, versionName)

            return convertToObjects ? _.map(dependencies, this.dependencyStringToObj) : dependencies 
        } catch (e) {
            log.error(`[getNativeDependencies] ${e}`);
            throw e;
        }
    }

    // Adds a native application binary (APP or APK) to the Cauldron for a given native app
    // binaryPath : Absolute or relative path to the binary [REQUIRED]
    // appName : The name of the app [REQUIRED]
    // platformName : The name of the platform of this application (android or ios) [REQUIRED]
    // versionName : The name of the version (i.e "4.1" or "4.1-dev-debug" or ...) [REQUIRED]
    async addNativeBinary(binaryPath,
                          appName,
                          platformName,
                          versionName) {
        try {
            required(binaryPath, 'binaryPath');
            required(appName, 'appName');
            required(platformName, 'platformName');
            required(versionName, 'versionName');

            return this.cauldron.createNativeBinary(
                appName, platformName, versionName, binaryPath);
        } catch (e) {
            log.error(`[addNativeBinary] ${e}`);
            throw e;
        }
    }

    // Retrieves a native app binary (APP or APK) from the Cauldron for a given native app
    // appName : The name of the app [REQUIRED]
    // platformName : The name of the platform of this application (android or ios) [REQUIRED]
    // versionName : The name of the version (i.e "4.1" or "4.1-dev-debug" or ...) [REQUIRED]
    async getNativeBinary(appName,
                          platformName,
                          versionName) {
        try {
            required(appName, 'appName');
            required(platformName, 'platformName');
            required(versionName, 'versionName');

            return this.cauldron.getNativeBinary(
                appName, platformName, versionName);
        } catch (e) {
            log.error(`[getNativeBinary] ${e}`);
            throw e;
        }
    }

    // Get a native dependency from the cauldron
    async getNativeDependency(appName, platformName, versionName, depName, { convertToObject=true } = {}) {
        const dependency = await this.cauldron.getNativeDependency(appName, platformName, versionName, depName)
        return convertToObject ? this.dependencyStringToObj(dependency) : dependency
    }

    // Update an existing native dependency version
    async updateNativeAppDependency(appName, platformName, versionName, dependencyName, newVersion) {
        await this.throwIfNativeAppVersionIsReleased(appName, platformName, versionName,
            'Cannot update a native dependency for a released native app version')

        return spin(`Updating dependency ${dependencyName} version to ${newVersion}`,
                this.cauldron.updateNativeDependency(appName, platformName, versionName, dependencyName, newVersion));
    }

    // Retrieves all native apps metadata from the Cauldron
    async getAllNativeApps() {
        return this.cauldron.getNativeApplications();
    }

    // Retrieves a specific react native app metadat from the Cauldron
    async getReactNativeApp(appName, platformName, versionName, miniAppName) {
        return this.cauldron.getReactNativeApp(appName, platformName, versionName, miniAppName);
    }

    // Retrieves the metadata of all react native apps that are part of
    // a given native application
    async getReactNativeApps(appName, platformName, versionName) {
        return this.cauldron.getReactNativeApps(appName, platformName, versionName);
    }

    // Add a react native app metadata to a given native application
    async addReactNativeApp(appName, platformName, versionName, app) {
        return spin(tagOneLine`Adding ${app.name}@${app.version} to
               ${appName}:${platformName}:${versionName}`,
            this.cauldron.createReactNativeApp(appName, platformName, versionName, app));
    }

    async getConfig(appName, platformName, versionName) {
        let config = await this.cauldron.getConfig({appName, platformName, versionName})
        if (!config) {
            config = await this.cauldron.getConfig({appName, platformName})
            if (!config) {
                config = await this.cauldron.getConfig({appName})
            }
        }
        return config
    }

    async updateNativeAppIsReleased(appName, platformName, versionName, isReleased) {
        return this.cauldron.updateVersion(appName, platformName, versionName, {isReleased});
    }

    async updateReactNativeAppVersion(appName, platformName, versionName, payload, newVersion) {
        return this.cauldron.updateReactNativeAppVersion(appName, platformName, versionName, payload, newVersion);
    }

    async throwIfNativeAppVersionIsReleased(appName, platformName, versionName, errorMessage) {
        const nativeAppVersion =
            await this.cauldron.getVersion(appName, platformName, versionName)

        if (nativeAppVersion.isReleased) {
            throw new Error(errorMessage)
        }
    }
}
export default new Cauldron(config.getValue('cauldronRepoInUse'));
