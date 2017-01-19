import child_process from 'child_process';
import fs from 'fs';
const execSync = child_process.execSync;

import _ from 'lodash';
import shell from 'shelljs';
import readDir from 'fs-readdir-recursive';
import { logInfo, logError } from './log.js';
import tagOneLine from './tagoneline.js';
import cauldron from './cauldron.js';
import platform from './platform.js';
import { compatCheck } from './compatibility.js';
import explodeNapSelector from './explodeNapSelector.js';
import generateRunner from '../../../ern-runner-gen/index.js';
import { runAndroid } from './android.js';

const NPM_SCOPED_MODULE_RE = /@(.*)\/(.*)/;

// Return all native dependencies currently used by the mini-app
// This method scans the node_modules folder to find any folder containing
// a build.gradle file (which at least is an indication that the folder contains
// some android native code.
// The dependencies are returned as a array of objects
// Each object represent a native dependency (name/version and optionaly scope)
// Sample output :
// [ { name: "react-native", version: "0.39.2", scope: "walmart" }]
export function getLocalNativeDependencies() {
  let result = [];

  if (!fs.existsSync('node_modules')) {
    logError(tagOneLine`No node_modules folder present.
              This command should be run at the root of a mini-app`);
    return result;
  }

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

export async function runInAndroidRunner() {
  if (!fs.existsSync('node_modules')) {
    logError(tagOneLine`No node_modules folder present.
              This command should be run at the root of a mini-app`);
    return result;
  }

  await runAndroid({
    projectPath: `${process.cwd()}/android`,
    packageName: 'com.walmartlabs.ern'
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
    // Otherwise, if no forced platform version provided, use latest platform
    // manifest version
    else if (!platformVersion) {
      platformVersion = platform.latestVersion;
    }

    if (platform.currentVersion !== platformVersion) {
      logInfo(`Switching platform to v${platformVersion}`);
      platform.switchToVersion(platformVersion);
    }

    logInfo(`Creating application ${appName} at platform version ${platformVersion}`);
    const rnVersion = platform.getDependency('react-native').version;

    //
    // Create application using react-native init command
    logInfo(`Running react-native init for react-native v${rnVersion}`);
    execSync(`react-native init ${appName} --version react-native@${rnVersion}`);

    //
    // Patch package.json file of application
    logInfo(`Patching package.json`);
    const appPackageJsonPath = `${process.cwd()}/${appName}/package.json`;
    const appPackageJson = JSON.parse(fs.readFileSync(appPackageJsonPath));
    appPackageJson.ernPlatformVersion = platformVersion;
    appPackageJson.private = false;
    if (scope) { appPackageJson.name = `@${scope}/${appName}`; }
    fs.writeFileSync(appPackageJsonPath, JSON.stringify(appPackageJson, null, 2));

    shell.cd(`${process.cwd()}/${appName}`);

    //
    // Remove react-native generated android project ...
    logInfo(`Removing react-native Android generate project`);
    shell.rm('-rf', `android`);

    //
    // ... and replace it with our own !
    // Kick-off runner project generator for this miniapp
    logInfo(`Generating android runner project`);
    await generateRunner({
      platformPath: platform.currentPlatformVersionPath,
      plugins: getLocalNativeDependencies(),
      miniapp: { name: appName, localPath: process.cwd() },
      outFolder: `${process.cwd()}/android`,
      verbose
    })

    logInfo(`done.`)
  } catch (e) {
    logError(`[ern init] ${e}`);
  }
}

export async function upgradeMiniAppToPlatformVersion(version) {
  const currentMiniAppPlatformVersion = getMiniAppPlatformVersion();

  if (currentMiniAppPlatformVersion === version) {
    return logError(`This miniapp is already using v${version}`);
  }

  if (currentMiniAppPlatformVersion > version) {
    return logError(`Downgrading is not supported. Could be. But no.`);
  }

  // Update all modules versions in package.json
  const appPackageJson = getMiniAppPackageJson();
  const miniAppDependencies = getMiniAppDependenciesAsNameVersionPairs();
  const supportedPlugins = platform.getSupportedPlugins(version);
  const plugins = _.intersectionBy(miniAppDependencies, supportedPlugins, 'name');
  for (const plugin of plugins) {
    let platformPluginVersion = platform.getDependency(plugin.name).version;
    let miniAppPluginVersion = _.find(miniAppDependencies, d => d,name === plugin.name).version;
    if (platformPluginVersion !== miniAppPluginVersion) {
      appPackageJson.dependencies[plugin.name] = platformPluginVersion;
      logInfo(`Updating ${plugin.name} version from ${miniAppPluginVersion} to ${platformPluginVersion}`)
    }
  }

  // Update ernPlatfomVersion in package.json
  appPackageJson.ernPlatformVersion = version;

  // Write back package.json
  fs.writeFileSync(appPackageJsonPath, JSON.stringify(appPackageJson, null, 2));

  logInfo(`Done. You should run npm install again or whatever`)
}

export async function publishInApp(
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

    logInfo(`Checking if ${miniAppDesc} is not already in binary of ${appDesc}`);
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

    logInfo(`Checking that container version match native app version`);
    const nativeApp = await cauldron.getNativeApp(appName, platformName, versionName);
    const nativeAppPlatformVersion = nativeApp.ernPlatformVersion;
    const miniAppPlatformVersion = getMiniAppPlatformVersion();
    /*if (nativeAppPlatformVersion !== miniAppPlatformVersion) {
      throw new Error(tagOneLine`Platform versions mismatch :
        [${miniAppName} => ${miniAppPlatformVersion}]
        [${appName}:${platformName}:${versionName} => ${nativeAppPlatformVersion}]`);
    }*/

    logInfo('Checking compatibility with each native dependency');
    let isCompatible = await compatCheck(
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


    logInfo(`DONE : ${miniAppDesc} added to ${appDesc}`);
  } catch (e) {
    logError(`[publishInApp ${e.message}`);
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

function getMiniAppPackageJson() {
  if (!fs.existsSync(`${process.cwd()}/package.json`)) {
    throw new Error(tagOneLine`No package.json found.
    This command should be run at the root of a mini-app`);
  }
  return require(`${process.cwd()}/package.json`);
}
