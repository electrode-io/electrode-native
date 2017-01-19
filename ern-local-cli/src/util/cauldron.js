import CauldronClient from '../../../ern-cauldron-cli/cli.js';
import ernConfig from './config.js';
import required from './required.js';
import { spin } from './spin.js';
import tagOneLine from './tagOneLine.js';
import { logInfo, logError } from './log.js';

//
// Helper class to access the cauldron
// It uses the ern-cauldron-cli client
class Cauldron {

  // cauldronUrl : The url to the cauldron service
  constructor(cauldronUrl) {
    this.cauldron = new CauldronClient(cauldronUrl);
  }

  // Adds a native application to the Cauldron
  // ernPlatformVersion : The version of the platform to use for this native app [REQUIRED]
  // appName : The name of the native application [REQUIRED]
  // platformName : The name of the platform of this application (android or ios)
  // versionName : The name of the version (i.e "4.1" or "4.1-dev-debug" or ...)
  async addNativeApp(
    ernPlatformVersion,
    appName,
    platformName,
    versionName) {
    try {
      required(ernPlatformVersion, 'ernPlatformVersion');
      required(appName, 'appName');

      return spin(tagOneLine`Adding ${appName} app
          ${versionName ? `at version ${versionName}` : ''}
          ${platformName ? `for ${platformName} platform` : ''}
          to cauldron`,
          this._addNativeApp(
            ernPlatformVersion,
            appName,
            platformName,
            versionName),
            false /*clean spin*/);
      logInfo('done.')
    } catch (e) {
      logError(`[addNativeApp] ${e}`);
      throw e;
    }
  }

  async _addNativeApp(
    ernPlatformVersion,
    appName,
    platformName,
    versionName) {
    await this.cauldron.addNativeApp({name: appName});
    if (platformName) {
      await this.cauldron.addPlatform(appName, {name: platformName});
      if (versionName) {
        await this.cauldron.addNativeAppVersion(
          appName, platformName, { name: versionName, ernPlatformVersion });
      }
    }
  }

  // Removes a native application from the Cauldron
  // appName : The name of the native application [REQUIRED]
  // platformName : The name of the platform of this application (android or ios)
  // versionName : The name of the version (i.e "4.1" or "4.1-dev-debug" or ...)
  async removeNativeApp(
    appName,
    platformName,
    versionName) {
    try {
      required(appName, 'appName');

      return spin(tagOneLine`Removing ${appName} app
          ${versionName ? `at version ${versionName}` : ''}
          ${platformName ? `for ${platformName} platform` : ''}
          from cauldron`,
          this._removeNativeApp(appName, platformName, versionName),
          false /* clean spin */)
      logInfo('done.')
    } catch(e) {
      logError(`[removeNativeApp] ${e}`);
      throw e;
    }
  }

  async _removeNativeApp(
    appName,
    platformName,
    versionName) {
    if (versionName) {
      await this.cauldron.deleteNativeAppVersion(
        appName, platformName, versionName);
    } else if (platformName) {
      await this.cauldron.deletePlatform(appName, platformName);
    } else {
      await this.cauldron.deleteNativeApp(appName);
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
  async addNativeDependency(
    dependency,
    appName,
    platformName,
    versionName) {
    try {
      required(dependency, 'dependency');
      required(appName, 'appName');
      required(platformName, 'platformName');
      required(versionName, 'versionName');

      return spin(
        tagOneLine`Adding dependency ${dependency.name}@${dependency.version}
                   to ${appName}:${platformName}:${versionName}`,
                   this.cauldron.addNativeAppDependency(
                      appName, platformName, versionName, dependency),
                   false /* clean spin */);

      logInfo('done.');
    } catch(e) {
      logError(`[addNativeDependency] ${e}`);
      throw e;
    }
  }

  // Removes a native dependency from the Cauldron
  // dependencyName : The name of the dependency to remove [REQUIRED]
  // appName : The name of the native application [REQUIRED]
  // platformName : The name of the platform of this application (android or ios) [REQUIRED]
  // versionName : The name of the version (i.e "4.1" or "4.1-dev-debug" or ...) [REQUIRED]
  async removeNativeDependency(
    dependencyName,
    appName,
    platformName,
    versionName) {
    try {
      required(dependencyName, 'dependencyName');
      required(appName, 'appName');
      required(platformName, 'platformName');
      required(versionName, 'versionName');

      return spin(
        tagOneLine`Removing dependency ${dependencyName} from
                  ${appName}:${platformName}:${versionName}`,
                  this.cauldron.deleteNativeAppDependency(
                    appName, platformName, versionName, dependencyName),
                  false /* clean spin */);
    } catch(e) {
      logError(`[removeNativeDependency] ${e}`);
      throw e;
    }
  }

  // Gets a native app metadata from the Cauldron
  // appName : The name of the app [REQUIRED]
  // platformName : The name of the platform of this application (android or ios) [REQUIRED]
  // versionName : The name of the version (i.e "4.1" or "4.1-dev-debug" or ...) [REQUIRED]
  async getNativeApp(
    appName,
    platformName,
    versionName) {
    try {
      required(appName, 'appName');

      if (versionName) {
        return this.cauldron.getNativeAppVersion(
          appName, platformName, versionName);
      } else if (platformName) {
        return this.cauldron.getPlatform(appName, platformName);
      } else {
        return this.cauldron.getNativeApp(appName);
      }
    } catch(e) {
      logError(`[getNativeApp] ${e}`);
      throw e;
    }
  }

  // Gets all native dependencies metadata from the Cauldron for a given native app
  // appName : The name of the app [REQUIRED]
  // platformName : The name of the platform of this application (android or ios) [REQUIRED]
  // versionName : The name of the version (i.e "4.1" or "4.1-dev-debug" or ...) [REQUIRED]
  async getNativeDependencies(
    appName,
    platformName,
    versionName) {
    try {
      required(appName, 'appName');
      required(platformName, 'platformName');
      required(versionName, 'versionName');

      return this.cauldron.getAllNativeAppDependencies(
        appName, platformName, versionName);
    } catch(e) {
      logError(`[getNativeDependencies] ${e}`);
      throw e;
    }
  }

  // Adds a native application binary (APP or APK) to the Cauldron for a given native app
  // binaryPath : Absolute or relative path to the binary [REQUIRED]
  // appName : The name of the app [REQUIRED]
  // platformName : The name of the platform of this application (android or ios) [REQUIRED]
  // versionName : The name of the version (i.e "4.1" or "4.1-dev-debug" or ...) [REQUIRED]
  async addNativeBinary(
    binaryPath,
    appName,
    platformName,
    versionName) {
    try {
      required(binaryPath, 'binaryPath');
      required(appName, 'appName');
      required(platformName, 'platformName');
      required(versionName, 'versionName');

      return this.cauldron.addNativeAppBinary(
        appName, platformName, versionName, binaryPath);
    } catch(e) {
      logError(`[addNativeBinary] ${e}`);
      throw e;
    }
  }

  // Retrieves a native app binary (APP or APK) from the Cauldron for a given native app
  // appName : The name of the app [REQUIRED]
  // platformName : The name of the platform of this application (android or ios) [REQUIRED]
  // versionName : The name of the version (i.e "4.1" or "4.1-dev-debug" or ...) [REQUIRED]
  async getNativeBinary(
    appName,
    platformName,
    versionName) {
    try {
      required(appName, 'appName');
      required(platformName, 'platformName');
      required(versionName, 'versionName');

      return this.cauldron.getNativeAppBinary(
        appName, platformName, versionName);
    } catch(e) {
      logError(`[getNativeBinary] ${e}`);
      throw e;
    }
  }

  // Retrieves all native apps metadata from the Cauldron
  async getAllNativeApps() {
    return this.cauldron.getAllNativeApps();
  }

  // Retrieves a specific react native app metadat from the Cauldron
  async getReactNativeApp(appName, platformName, versionName, miniAppName) {
    return this.cauldron.getReactNativeApp(appName, platformName, versionName, miniAppName);
  }

  // Retrieves the metadata of all react native apps that are part of
  // a given native application
  async getReactNativeApps(appName, platformName, versionName) {
    return this.cauldron.getAllReactNativeApps(appName, platformName, versionName);
  }

  // Add a react native app metadata to a given native application
  async addReactNativeApp(appName, platformName, versionName, app) {
    return spin(tagOneLine`Adding ${app.name}@${app.version} to
               ${appName}:${platformName}:${versionName}`,
          this.cauldron.addReactNativeApp(appName, platformName, versionName, app),
          false /*clean spin*/);
  }
 }

export default new Cauldron(ernConfig.obj.cauldronUrl);
