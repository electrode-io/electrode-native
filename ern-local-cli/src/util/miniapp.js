import child_process from 'child_process';
import fs from 'fs';
const exec = child_process.exec;
const execSync = child_process.execSync;

import _ from 'lodash';
import chalk from 'chalk';
import shell from 'shelljs';
import readDir from 'fs-readdir-recursive';
const log = require('console-log-level')();
import tagOneLine from './tagoneline.js';
import cauldron from './cauldron.js';
import platform from './platform.js';
import { nativeCompatCheck } from './compatibility.js';
import explodeNapSelector from './explodeNapSelector.js';
import { generateRunner,  generateContainerForRunner } from '../../../ern-runner-gen/index.js';
import { runAndroid } from './android.js';
import { spin } from './spin.js';
import { yarnAdd, yarnInstall } from './yarn.js';
import { reactNativeInit } from './reactnative.js';

const NPM_SCOPED_MODULE_RE = /@(.*)\/(.*)/;
const WORKING_FOLDER = process.cwd();

export default class MiniApp {

  //
  // Constructor just takes the path to folder containining miniapp
  constructor(miniAppPath) {
    this._path = miniAppPath;

    const packageJsonPath = `${miniAppPath}/package.json`;
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error(tagOneLine`No package.json found.
      This command should be run at the root of a mini-app`);
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath));
    if (!packageJson.ernPlatformVersion) {
      throw new Error(tagOneLine`No ernPlatformVersion found in package.json.
      Are you sure you are running this within an electrode miniapp folder ?`);
    }

    this._packageJson = packageJson;
  }

  static fromCurrentPath() {
    return new MiniApp(process.cwd());
  }

  static fromPath(path) {
    return new MiniApp(path);
  }

  static async create(appName, {
    platformVersion,
    napSelector,
    scope,
    verbose,
    headless
  }) {
    try {
      // If appSelector provided, and no forced version of platform is provided
      // use same ernPlatformVersion as native app one
      if (!platformVersion && napSelector) {
        const nativeApp =
          await cauldron.getNativeApp(
            ...explodeNapSelector(napSelector));
        platformVersion = nativeApp.ernPlatformVersion;
      }
      // Otherwise, if no forced platform version provided, use current platform version
      else if (!platformVersion) {
        platformVersion = platform.currentVersion;
      }

      if (platform.currentVersion !== platformVersion) {
        platform.switchToVersion(platformVersion);
      }

      log.info(`Creating application ${appName} at platform version ${platformVersion}`);
      const rnVersion = platform.getPlugin('react-native').version;

      //
      // Create application using react-native init command
      await spin(`Running react-native init using react-native v${rnVersion}`,
           reactNativeInit(appName, rnVersion));

      //
      // Patch package.json file of application
      const appPackageJsonPath = `${process.cwd()}/${appName}/package.json`;
      const appPackageJson = JSON.parse(fs.readFileSync(appPackageJsonPath, 'utf-8'));
      appPackageJson.ernPlatformVersion = platformVersion;
      appPackageJson.ernHeadLess = headless;
      appPackageJson.private = false;
      if (scope) { appPackageJson.name = `@${scope}/${appName}`; }
      fs.writeFileSync(appPackageJsonPath, JSON.stringify(appPackageJson, null, 2));

      //
      // Remove react-native generated android project ...
      // It will be replaced with our own when user uses `ern miniapp run android` command
      const miniAppPath = `${process.cwd()}/${appName}`;
      shell.cd(miniAppPath);
      shell.rm('-rf', `android`);

      //
      /// If it's a headless miniapp (no ui), just override index.android.js / index.ios.js
      // with our own and create index.source.js
      // Later on it might be done in a better way by retrieving our own structured
      // project rather than using react-native generated on and patching it !
      if (headless) {
        fs.writeFileSync(`${miniAppPath}/index.android.js`, "require('./index.source');", 'utf-8');
        fs.writeFileSync(`${miniAppPath}/index.ios.js`, "require('./index.source');", 'utf-8');
        fs.writeFileSync(`${miniAppPath}/index.source.js`, "// Add your implementation here", 'utf-8');
      }

      return new MiniApp(miniAppPath);
    } catch (e) {
      log.error(`[MiniApp.create] ${e}`);
    }
  }

  get packageJson() {
    return this._packageJson;
  }

  get path() {
    return this._path;
  }

  get name() {
    return this.getUnscopedModuleName(this.packageJson.name);
  }

  get version() {
    return this.packageJson.version;
  }

  get platformVersion() {
    return this.packageJson.ernPlatformVersion;
  }

  get isHeadLess() {
    return this.packageJson.ernHeadLess;
  }

  // Return all native dependencies currently used by the mini-app
  // This method scans the node_modules folder to find any folder containing
  // a build.gradle file (which at least is an indication that the folder contains
  // some android native code.
  // The dependencies are returned as a array of objects
  // Each object represent a native dependency (name/version and optionaly scope)
  // Sample output :
  // [ { name: "react-native", version: "0.39.2", scope: "walmart" }]
  get nativeDependencies() {
    let result = [];

    const nativeDependenciesNames = new Set();

    // Get names of all native deps
    const nativeDepsFolders = readDir(`${this.path}/node_modules`)
                              .filter(a => a.includes('build.gradle'));
    for (const nativeDepsFolder of nativeDepsFolders) {
      // Scoped module
      if (nativeDepsFolder.split('/')[0].startsWith('@')) {
        nativeDependenciesNames.add(
          `${nativeDepsFolder.split('/')[0]}/${nativeDepsFolder.split('/')[1]}`);
      }
      // Non scoped module
      else {
        nativeDependenciesNames.add(nativeDepsFolder.split('/')[0]);
      }
    }

    // Get associated versions
    for (const nativeDependencyName of nativeDependenciesNames) {
      const nativeDepPackageJson = require(
        `${this.path}/node_modules/${nativeDependencyName}/package.json`);

      if (NPM_SCOPED_MODULE_RE.test(nativeDependencyName)) {
        result.push({
          name: NPM_SCOPED_MODULE_RE.exec(nativeDependencyName)[2],
          scope: NPM_SCOPED_MODULE_RE.exec(nativeDependencyName)[1],
          version: nativeDepPackageJson.version
        });
      } else {
        result.push({
          name: nativeDependencyName,
          version: nativeDepPackageJson.version
        });
      }
    }

    return result;
  }

  async runInAndroidRunner(verbose) {
    const runnerConfig = {
      platformPath: platform.currentPlatformVersionPath,
      plugins: this.nativeDependencies,
      miniapp: { name: this.name, localPath: this.path },
      outFolder: `${this.path}/android`,
      verbose,
      headless: this.isHeadLess
    };

    // Generate initial runner project if it hasn't been created yet
    if (!fs.existsSync('android')) {
      log.info(`Generating runner Android project`);
      await generateRunner(runnerConfig);
    }
    // Otherwise just regenerates container library
    else {
      log.info(`Re-generating runner container`);
      await generateContainerForRunner(runnerConfig);
    }

    await runAndroid({
      projectPath: `${this.path}/android`,
      packageName: 'com.walmartlabs.ern'
    });
  }

  async addPlugin(pluginString) {
    const plugin = platform.getPlugin(pluginString);
    if (!plugin) {
      return log.error(`Plugin ${pluginString} is not available in current container version`);
    }

    process.chdir(this.path);
    if (plugin.scope) {
      await spin(`Installing @${plugin.scope}/${plugin.name}@${plugin.version}`, yarnAdd(plugin));
    } else {
      await spin(`Installing ${plugin.name}@${plugin.version}`, yarnAdd(plugin));
    }
  }

  async upgradeToPlatformVersion(versionToUpgradeTo, force) {
    if ((this.platformVersion === versionToUpgradeTo)
      // Do not enforce if v1000 to help with development (should be temporary)
      && (!force)) {
      return log.error(`This miniapp is already using v${versionToUpgradeTo}. Use 'f' flag if you want to force upgrade.`);
    }

    if (this.platformVersion > versionToUpgradeTo) {
      return log.error(`Downgrading is not supported. Could be. But no.`);
    }

    // Update all modules versions in package.json
    const supportedPlugins = platform.getSupportedPlugins(versionToUpgradeTo);

    for (const supportedPlugin of supportedPlugins) {
      const nameWithScope = `${supportedPlugin.scope?`@${supportedPlugin.scope}/`:''}${supportedPlugin.name}`;
      if (this.packageJson.dependencies[nameWithScope]) {
        const pluginManifestVersion = supportedPlugin.version;
        const currentPluginVersion = this.packageJson.dependencies[nameWithScope];
        if (pluginManifestVersion != currentPluginVersion) {
          log.info(`${nameWithScope} : ${currentPluginVersion} => ${pluginManifestVersion}`);
          this.packageJson.dependencies[nameWithScope] = pluginManifestVersion;
        }
      }
    }

    // Update ernPlatfomVersion in package.json
    this.packageJson.ernPlatformVersion = versionToUpgradeTo;

    // Write back package.json
    const appPackageJsonPath = `${this.path}/package.json`;
    fs.writeFileSync(appPackageJsonPath, JSON.stringify(this.packageJson, null, 2));

    process.chdir(this.path);
    await spin(`Running yarn install`, yarnInstall());
  }

  async addToNativeAppInCauldron(
    appName = required('appName'),
    platformName = required('platformName'),
    versionName = required('versionName'),
    force) {
    try {
      let miniAppName, miniAppScope;

      const nameFromPackageJson = this.packageJson.name;

      if (NPM_SCOPED_MODULE_RE.test(nameFromPackageJson)) {
        miniAppScope = NPM_SCOPED_MODULE_RE.exec(nameFromPackageJson)[1];
        miniAppName = NPM_SCOPED_MODULE_RE.exec(nameFromPackageJson)[2];
      } else {
        miniAppName = nameFromPackageJson;
      }

      const miniAppDesc = `${miniAppName}@${this.version}`;
      const appDesc = `${appName}:${platformName}:${versionName}`;
      const nativeApp = await cauldron.getNativeApp(appName, platformName, versionName);

      // If this is not a forced add, we run quite some checks beforehand
      if (!force) {
        log.info(`Checking if ${miniAppDesc} is not already in ${appDesc}`);
        let currentMiniAppEntryIncauldron;

        try {
          currentMiniAppEntryIncauldron =
            await cauldron.getReactNativeApp(
              appName, platformName, versionName, miniAppName);
        } catch (e) {
          currentMiniAppEntryIncauldron = [];
        };
        const isVersionPresent =
          _.find(currentMiniAppEntryIncauldron, e => e.version === this.version);
        if (isVersionPresent) {
          throw new Error(`${miniAppDesc} already in binary of ${appDesc}`);
        }

        log.info(`Checking that container version match native app version`);
        const nativeAppPlatformVersion = nativeApp.ernPlatformVersion;
        const miniAppPlatformVersion = this.platformVersion;
        /*if (nativeAppPlatformVersion !== miniAppPlatformVersion) {
          throw new Error(tagOneLine`Platform versions mismatch :
            [${miniAppName} => ${miniAppPlatformVersion}]
            [${appName}:${platformName}:${versionName} => ${nativeAppPlatformVersion}]`);
        }*/

        log.info('Checking compatibility with each native dependency');
        let isCompatible = await nativeCompatCheck(
          true, appName, platformName, versionName);
        if (!isCompatible) {
          throw new Error('At least a native dependency is incompatible');
        }
      }

      for (const localNativeDependency of this.nativeDependencies) {
        // optimize : should only be done if new native dep (not already in cauldron)
        if (!force) {
          await cauldron.addNativeDependency(
            localNativeDependency, appName, platformName, versionName);
        }
        // Forced add. Update dependency versions in cauldron if needed.
        else {
          const nativeDepInCauldron = await cauldron
            .getNativeDependency(appName, platformName, versionName, localNativeDependency.name);
          if (nativeDepInCauldron) {
            await cauldron.updateNativeAppDependency(
              appName, platformName, versionName, localNativeDependency.name, localNativeDependency.version);
          } else {
            await cauldron.addNativeDependency(
              localNativeDependency, appName, platformName, versionName);
          }
        }
      }

      const miniApp = Object.assign({
        name: miniAppName,
        version: this.version,
        isInBinary: !nativeApp.isReleased
      }, miniAppScope ?
      {
        scope: miniAppScope
      } : {});

      await cauldron.addReactNativeApp(appName, platformName, versionName, miniApp);

    } catch (e) {
      log.error(`[addMiniAppToNativeAppInCauldron ${e.message}`);
        throw e;
    }
  }

  // Should go somewhere else. Does not belong in MiniApp class
  getUnscopedModuleName(moduleName) {
    const npmScopeModuleRe = /(@.*)\/(.*)/;
    return npmScopeModuleRe.test(moduleName) ?
           npmScopeModuleRe.exec(`${moduleName}`)[2]
        :  moduleName;
  }
}
