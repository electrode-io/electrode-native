import CauldronClient from '../../../ern-cauldron-cli/cli.js';
import ernConfig from './config.js';
import required from './required.js';
import spin from './spin.js';
import tagOneLine from './tagOneLine.js';
import { logInfo, logError } from './log.js';

class Cauldron {
  constructor(cauldronUrl) {
    this.cauldron = new CauldronClient(cauldronUrl);
  }

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

  async getAllNativeApps() {
    return this.cauldron.getAllNativeApps();
  }

  async getReactNativeApp(appName, platformName, versionName, miniAppName) {
    return this.cauldron.getReactNativeApp(appName, platformName, versionName, miniAppName);
  }

  async getReactNativeApps(appName, platformName, versionName) {
    return this.cauldron.getAllReactNativeApps(appName, platformName, versionName);
  }

  async addReactNativeApp(appName, platformName, versionName, app) {
    return spin(tagOneLine`Adding ${app.name}@${app.version} to
               ${appName}:${platformName}:${versionName}`,
          this.cauldron.addReactNativeApp(appName, platformName, versionName, app),
          false /*clean spin*/);
  }
 }

export default new Cauldron(ernConfig.obj.cauldronUrl);
