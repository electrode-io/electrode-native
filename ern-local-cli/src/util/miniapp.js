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
import { yarnAdd } from './yarn.js';

const NPM_SCOPED_MODULE_RE = /@(.*)\/(.*)/;
const WORKING_FOLDER = process.cwd();

// Return all native dependencies currently used by the mini-app
// This method scans the node_modules folder to find any folder containing
// a build.gradle file (which at least is an indication that the folder contains
// some android native code.
// The dependencies are returned as a array of objects
// Each object represent a native dependency (name/version and optionaly scope)
// Sample output :
// [ { name: "react-native", version: "0.39.2", scope: "walmart" }]
export function getLocalNativeDependencies() {
  throwErrorIfNotWithinMiniAppFolder();

  let result = [];

  const nativeDependenciesNames = new Set();

  // Get names of all native deps
  const nativeDepsFolders = readDir('./node_modules')
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
      `${process.cwd()}/node_modules/${nativeDependencyName}/package.json`);

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

//return child_process.spawnSync('open', [launchPackagerScript], procConfig);
export async function runInAndroidRunner(verbose) {
  throwErrorIfNotWithinMiniAppFolder();

  const runnerConfig = {
    platformPath: platform.currentPlatformVersionPath,
    plugins: getLocalNativeDependencies(),
    miniapp: { name: getMiniAppName(), localPath: WORKING_FOLDER },
    outFolder: `${WORKING_FOLDER}/android`,
    verbose
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
    projectPath: `${WORKING_FOLDER}/android`,
    packageName: 'com.walmartlabs.ern'
  });

}

export async function addPluginToMiniApp(pluginString) {
  throwErrorIfNotWithinMiniAppFolder();

  const plugin = platform.getPlugin(pluginString);
  if (!plugin) {
    return log.error(`Plugin ${pluginString} is not available in current container version`);
  }

  if (plugin.scope) {
    await spin(`Installing @${plugin.scope}/${plugin.name}@${plugin.version}`, yarnAdd(plugin));
  } else {
    await spin(`Installing ${plugin.name}@${plugin.version}`, yarnAdd(plugin));
  }
}

const npmScopeModuleRe = /(@.*)\/(.*)/;
function getUnscopedModuleName(moduleName) {
  return npmScopeModuleRe.test(moduleName) ?
         npmScopeModuleRe.exec(`${moduleName}`)[2]
      :  moduleName;
}

function getMiniAppName() {
  const appPackageJson = getMiniAppPackageJson();
  return getUnscopedModuleName(appPackageJson.name);
}

async function reactNativeInit(appName, rnVersion) {
  return new Promise((resolve, reject) => {
    exec(`react-native init ${appName} --version react-native@${rnVersion}`,
      (err, stdout, stderr) => {
      if (err) {
        log.error(err);
        reject(err);
      } else if (stdout) {
        resolve(stdout);
      }
    });
  });
}

export async function createMiniApp(appName, {
  platformVersion,
  napSelector,
  scope,
  verbose
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
    const appPackageJson = JSON.parse(fs.readFileSync(appPackageJsonPath));
    appPackageJson.ernPlatformVersion = platformVersion;
    appPackageJson.private = false;
    if (scope) { appPackageJson.name = `@${scope}/${appName}`; }
    fs.writeFileSync(appPackageJsonPath, JSON.stringify(appPackageJson, null, 2));

    shell.cd(`${process.cwd()}/${appName}`);

    //
    // Remove react-native generated android project ...
    // It will be replaced with our own when user uses `ern miniapp run android` command
    shell.rm('-rf', `android`);
  } catch (e) {
    log.error(`[ern init] ${e}`);
  }
}

export async function upgradeMiniAppToPlatformVersion(version) {
  const currentMiniAppPlatformVersion = getMiniAppPlatformVersion();

  if (currentMiniAppPlatformVersion === version) {
    return log.error(`This miniapp is already using v${version}`);
  }

  if (currentMiniAppPlatformVersion > version) {
    return log.error(`Downgrading is not supported. Could be. But no.`);
  }

  // Update all modules versions in package.json
  const appPackageJson = getMiniAppPackageJson();
  const miniAppDependencies = getMiniAppDependenciesAsNameVersionPairs();
  const supportedPlugins = platform.getSupportedPlugins(version);
  const plugins = _.intersectionBy(miniAppDependencies, supportedPlugins, 'name');
  for (const plugin of plugins) {
    let platformPluginVersion = platform.getPlugin(plugin.name).version;
    let miniAppPluginVersion = _.find(miniAppDependencies, d => d,name === plugin.name).version;
    if (platformPluginVersion !== miniAppPluginVersion) {
      appPackageJson.dependencies[plugin.name] = platformPluginVersion;
      log.info(`Updating ${plugin.name} version from ${miniAppPluginVersion} to ${platformPluginVersion}`)
    }
  }

  // Update ernPlatfomVersion in package.json
  appPackageJson.ernPlatformVersion = version;

  // Write back package.json
  fs.writeFileSync(appPackageJsonPath, JSON.stringify(appPackageJson, null, 2));

  log.info(`Done. You should run npm install again or whatever`)
}

export async function addMiniAppToNativeAppInCauldron(
  appName = required('appName'),
  platformName = required('platformName'),
  versionName = required('versionName')) {
  try {
    const packageJson = getMiniAppPackageJson();

    let miniAppName, miniAppScope;

    if (NPM_SCOPED_MODULE_RE.test(packageJson.name)) {
      miniAppScope = NPM_SCOPED_MODULE_RE.exec(packageJson.name)[1];
      miniAppName = NPM_SCOPED_MODULE_RE.exec(packageJson.name)[2];
    } else {
      miniAppName = packageJson.name;
    }

    const miniAppVersion = packageJson.version;
    const miniAppDesc = `${miniAppName}@${miniAppVersion}`;
    const appDesc = `${appName}:${platformName}:${versionName}`;

    log.info(`Checking if ${miniAppDesc} is not already in binary of ${appDesc}`);
    let currentMiniAppEntryIncauldron;

    try {
      currentMiniAppEntryIncauldron =
        await cauldron.getReactNativeApp(
          appName, platformName, versionName, miniAppName);
    } catch (e) {
      currentMiniAppEntryIncauldron = [];
    };
    const isVersionPresent =
      _.find(currentMiniAppEntryIncauldron, e => e.version === miniAppVersion);
    if (isVersionPresent) {
      throw new Error(`${miniAppDesc} already in binary of ${appDesc}`);
    }

    log.info(`Checking that container version match native app version`);
    const nativeApp = await cauldron.getNativeApp(appName, platformName, versionName);
    const nativeAppPlatformVersion = nativeApp.ernPlatformVersion;
    const miniAppPlatformVersion = getMiniAppPlatformVersion();
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

    const localNativeDependencies = getLocalNativeDependencies();
    for (const localNativeDependency of localNativeDependencies) {
      // optimize : should only be done if new native dep (not already in cauldron)
      await cauldron.addNativeDependency(
        localNativeDependency, appName, platformName, versionName);
    }

    if (miniAppScope) {
      await cauldron.addReactNativeApp(appName, platformName, versionName, {
        name: miniAppName,
        scope: miniAppScope,
        version: miniAppVersion,
        isInBinary: true
      });
    } else {
      await cauldron.addReactNativeApp(appName, platformName, versionName, {
        name: miniAppName,
        version: miniAppVersion,
        isInBinary: true
      });
    }
  } catch (e) {
    log.error(`[addMiniAppToNativeAppInCauldron ${e.message}`);
  }
}

export function getMiniAppPlatformVersion() {
  const appPackageJson = getMiniAppPackageJson();
  return appPackageJson.ernPlatformVersion;
}

function getMiniAppDependenciesAsNameVersionPairs() {
  const moduleRe = /(.*)@(.*)/;
  return _.map(getMiniAppPackageJson().dependencies, (d) => ({
          name: moduleRe.exec(d)[1],
          version: moduleRe.exec(d)[2]
        }));
}

// Not looking very nice. Well ...
function throwErrorIfNotWithinMiniAppFolder() {
  return getMiniAppPackageJson();
}

function getMiniAppPackageJson() {
  const packageJsonPath = `${WORKING_FOLDER}/package.json`;
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(tagOneLine`No package.json found.
    This command should be run at the root of a mini-app`);
  }
  const packageJsonObj = JSON.parse(fs.readFileSync(packageJsonPath));
  if (!packageJsonObj.ernPlatformVersion) {
    throw new Error(tagOneLine`No ernPlatformVersion found in package.json.
    Are you sure you are running this within an electrode miniapp folder ?`);
  }
  return packageJsonObj;
}
