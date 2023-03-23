import fs from 'fs-extra';
import inquirer from 'inquirer';
import shell from './shell';
import ernConfig from './config';
import * as deviceConfigUtil from './deviceConfig';
import log from './log';
import { execp, spawnp } from './childProcess';
import kax from './kax';
import semver from 'semver';

// ==============================================================================
// Default value for android build config
// ==============================================================================

export const DEFAULT_ANDROID_GRADLE_PLUGIN_VERSION = '7.0.4';
export const DEFAULT_ANDROIDX_APPCOMPACT_VERSION = '1.1.0';
export const DEFAULT_ANDROIDX_LIFECYCLE_EXTENSIONS_VERSION = '2.1.0';
export const DEFAULT_BUILD_TOOLS_VERSION = '31.0.0';
export const DEFAULT_COMPILE_SDK_VERSION = '31';
export const DEFAULT_GRADLE_DISTRIBUTION_VERSION = '7.3.3';
export const DEFAULT_JSC_VARIANT = 'android-jsc';
export const DEFAULT_KOTLIN_VERSION = '1.6.10';
export const DEFAULT_MIN_SDK_VERSION_PRE_RN64 = '19';
export const DEFAULT_MIN_SDK_VERSION_POST_RN64 = '21';
export const DEFAULT_SUPPORT_LIBRARY_VERSION = '28.0.0';
export const DEFAULT_TARGET_SDK_VERSION = '30';
export const DEFAULT_SOURCE_COMPATIBILITY = 'VERSION_1_8';
export const DEFAULT_TARGET_COMPATIBILITY = 'VERSION_1_8';
const ANDROID_DEVICE_INFO = `
https://developer.android.com/studio/run/emulator-commandline
https://developer.android.com/studio/run/emulator`;

export interface AndroidResolvedVersions {
  androidGradlePlugin: string;
  androidxAppcompactVersion: string;
  androidxLifecycleExtrnsionsVersion: string;
  buildToolsVersion: string;
  compileSdkVersion: string;
  gradleDistributionVersion: string;
  kotlinVersion: string;
  minSdkVersion: string;
  reactNativeAarVersion: string;
  sourceCompatibility: string;
  supportLibraryVersion: string;
  targetCompatibility: string;
  targetSdkVersion: string;
}

export function resolveAndroidVersions({
  androidGradlePlugin = DEFAULT_ANDROID_GRADLE_PLUGIN_VERSION,
  androidxAppcompactVersion = DEFAULT_ANDROIDX_APPCOMPACT_VERSION,
  androidxLifecycleExtrnsionsVersion = DEFAULT_ANDROIDX_LIFECYCLE_EXTENSIONS_VERSION,
  buildToolsVersion = DEFAULT_BUILD_TOOLS_VERSION,
  compileSdkVersion = DEFAULT_COMPILE_SDK_VERSION,
  gradleDistributionVersion = DEFAULT_GRADLE_DISTRIBUTION_VERSION,
  kotlinVersion = DEFAULT_KOTLIN_VERSION,
  minSdkVersion,
  reactNativeAarVersion,
  sourceCompatibility = DEFAULT_SOURCE_COMPATIBILITY,
  supportLibraryVersion = DEFAULT_SUPPORT_LIBRARY_VERSION,
  targetCompatibility = DEFAULT_TARGET_COMPATIBILITY,
  targetSdkVersion = DEFAULT_TARGET_SDK_VERSION,
  reactNativeVersion,
}: {
  androidGradlePlugin?: string;
  androidxAppcompactVersion?: string;
  androidxLifecycleExtrnsionsVersion?: string;
  buildToolsVersion?: string;
  compileSdkVersion?: string;
  gradleDistributionVersion?: string;
  kotlinVersion?: string;
  minSdkVersion?: string;
  reactNativeAarVersion?: string;
  sourceCompatibility?: string;
  supportLibraryVersion?: string;
  targetCompatibility?: string;
  targetSdkVersion?: string;
  reactNativeVersion?: string;
} = {}): AndroidResolvedVersions {
  const resolvedMinSdkVersion = minSdkVersion
    ? minSdkVersion
    : semver.gte(reactNativeVersion!, '0.64.0')
    ? DEFAULT_MIN_SDK_VERSION_POST_RN64
    : DEFAULT_MIN_SDK_VERSION_PRE_RN64;

  reactNativeAarVersion = reactNativeAarVersion ?? reactNativeVersion!;

  return {
    androidGradlePlugin,
    androidxAppcompactVersion,
    androidxLifecycleExtrnsionsVersion,
    buildToolsVersion,
    compileSdkVersion,
    gradleDistributionVersion,
    kotlinVersion,
    minSdkVersion: resolvedMinSdkVersion,
    reactNativeAarVersion,
    sourceCompatibility,
    supportLibraryVersion,
    targetCompatibility,
    targetSdkVersion,
  };
}

// ==============================================================================
// Misc utilities
// ==============================================================================

// Returns a promise that will get resolved after a given delay (in ms)
async function delay(ms: number) {
  return new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}

// Returns a promise that will get rejected after a given timeout (in ms)
async function failAfterTimeOut(ms: number) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(
        new Error(
          `Failed to collect the device/emulator state.${ANDROID_DEVICE_INFO}`,
        ),
      );
    }, ms);
  });
}

// ==============================================================================
// Core android stuff
// ==============================================================================

//
// Build and run a project on an Android emulator or connected device
// The `devDebug` variant will be built and launched on an emulator selected by
// the user (this function prompts the user with a list of available avd to choose from)
//
// Assumptions :
// - devDebug variant exists in the project
// Params :
// - activityName : The name of the Activity to start (default "MainActivity")
// - launchFlags: Flags to pass to the application when launching it
// - packageName : Name of the package containing the application
// Options :
// - projectPath : Absolute or relative path to the root of the Android projectPath

export async function runAndroidProject({
  activityName = 'MainActivity',
  launchFlags,
  packageName,
  projectPath,
}: {
  activityName?: string;
  launchFlags?: string;
  packageName: string;
  projectPath: string;
}) {
  return runAndroid({
    activityName,
    launchFlags,
    packageName,
    projectPath,
  });
}

//
// Run an android APK on an Android emulator or connected device
//
// Params :
// - apkPath : Absolute or relative path to the APK
// - packageName : Name of the package containing the application
// Options :
// - activityName : The name of the Activity to start (default "MainActivity")
export async function runAndroidApk({
  activityName = 'MainActivity',
  apkPath,
  launchFlags,
  packageName,
}: {
  activityName?: string;
  apkPath: string;
  launchFlags?: string;
  packageName: string;
}) {
  return runAndroid({
    activityName,
    apkPath,
    launchFlags,
    packageName,
  });
}

export async function runAndroid({
  activityName,
  apkPath,
  launchFlags,
  packageName,
  projectPath,
}: {
  activityName: string;
  apkPath?: string;
  launchFlags?: string;
  packageName: string;

  projectPath?: string;
}) {
  const devices = await getDevices();
  // install and launch the app if 1 emulator instance is running
  if (devices.length === 1) {
    log.debug(`${devices[0].split('\t')[0]} is running ...`);
    await installAndLaunchApp({
      activityName,
      apkPath,
      launchFlags,
      packageName,
      projectPath,
    });
  } else if (devices.length > 1) {
    throw new Error('More than one device/emulator is running !');
  } else {
    const avdImageName = await askUserToSelectAvdEmulator();
    return runAndroidUsingAvdImage({
      activityName,
      apkPath,
      avdImageName,
      launchFlags,
      packageName,
      projectPath,
    });
  }
}

export async function askUserToSelectAvdEmulator(): Promise<string> {
  const avdImageNames = await getAndroidAvds();
  if (Array.isArray(avdImageNames) && avdImageNames.length === 0) {
    throw new Error(
      `No Emulator or device found. Launch an emulator manually or connect a device.${ANDROID_DEVICE_INFO}`,
    );
  }
  const deviceConfig = ernConfig.get(deviceConfigUtil.ANDROID_DEVICE_CONFIG);
  // Check if user has set the usePreviousEmulator flag to true
  if (avdImageNames && deviceConfig) {
    if (deviceConfig.usePreviousDevice) {
      // Get the name of previously used device
      const deviceId = deviceConfig.deviceId;
      // Check if avd image still exists
      const avdIndex = avdImageNames.indexOf(deviceId);
      if (avdIndex > -1) {
        return `${avdImageNames[avdIndex]}`;
      }
    }
  }

  // if avd image is still not resolved
  const { avdImageName } = await inquirer.prompt([
    <inquirer.Question>{
      choices: avdImageNames,
      message: 'Choose Android device image',
      name: 'avdImageName',
      type: 'list',
    },
  ]);

  // Update the device Config
  if (deviceConfig) {
    deviceConfig.deviceId = avdImageName;
    ernConfig.set(deviceConfigUtil.ANDROID_DEVICE_CONFIG, deviceConfig);
  }
  return `${avdImageName}`;
}

// Does the job of actually running the app
// It orchestrates a few tasks to actually get the job done
// Params :
// - projectPath : Absolute or relative path to the root of the Android projectPath
// - packageName : name of the package containing the application
// - avdImageName : name of the avd image to use (device image)
export async function runAndroidUsingAvdImage({
  activityName,
  apkPath,
  launchFlags,
  avdImageName,
  packageName,
  projectPath,
}: {
  activityName: string;
  apkPath?: string;
  avdImageName: string;
  launchFlags?: string;
  packageName: string;
  projectPath?: string;
}) {
  // https://issuetracker.google.com/issues/37137213
  spawnp(androidEmulatorPath(), ['-avd', avdImageName], { detached: true });
  await kax
    .task('Waiting for device to start')
    .run(
      Promise.race([waitForAndroidDevice(), failAfterTimeOut(3 * 60 * 1000)]),
    );
  await installAndLaunchApp({
    activityName,
    apkPath,
    launchFlags,
    packageName,
    projectPath,
  });
}

// Does the job of installing and running the app
// It orchestrates a few tasks to actually get the job done
// Params :
// - projectPath : Absolute or relative path to the root of the Android projectPath
// - packageName : name of the package containing the application
export async function installAndLaunchApp({
  activityName,
  apkPath,
  launchFlags,
  packageName,
  projectPath,
}: {
  activityName: string;
  apkPath?: string;
  launchFlags?: string;
  packageName: string;
  projectPath?: string;
}) {
  if (projectPath) {
    await kax
      .task('Building and installing application')
      .run(buildAndInstallApp(projectPath));
  } else if (apkPath) {
    await kax.task('Installing APK').run(installApk(apkPath));
  }
  await kax.task('Launching Android Application').run(Promise.resolve());
  launchAndroidActivityDetached(packageName, activityName, { launchFlags });
}

// Utility method that basically completes whenever the android device is ready
// It check device readiness every 2 sec (poll way)
export async function waitForAndroidDevice() {
  let androidBootAnimProp = await androidGetBootAnimProp();
  while (!androidBootAnimProp.toString().startsWith('stopped')) {
    await delay(2000);
    androidBootAnimProp = await androidGetBootAnimProp();
  }
}

// Utility method to know when the prop init.svc.bootanim is there
// which indicates somehow that device is ready to install APK and such
export async function androidGetBootAnimProp() {
  return execp(
    `${androidAdbPath()} wait-for-device shell getprop init.svc.bootanim`,
  );
}

// Build & install application on the device
// params :
// - projectPath : Absolute or relative path to the root of the Android project
// containing the application
export async function buildAndInstallApp(projectPath: string) {
  shell.pushd(projectPath);
  try {
    const gradlew = getGradleByPlatform();
    return execp(`${gradlew} installDebug`);
  } finally {
    shell.popd();
  }
}

export function getGradleByPlatform(): string {
  return /^win/.test(process.platform) ? 'gradlew' : './gradlew';
}

// Utility method to launch a specific activity from a given package
// Params :
// - packageName : name of the package containing the application
// - activityName : name of the Activity to launch
export async function launchAndroidActivity(
  packageName: string,
  activityName: string,
) {
  return execp(
    `${androidAdbPath()} shell am start -n ${packageName}/.${activityName}`,
  );
}

// Utility method to launch a specific activity from a given packager
// Will spawn the command (detached mode)
export function launchAndroidActivityDetached(
  packageName: string,
  activityName: string,
  { launchFlags = '' }: { launchFlags?: string } = {},
) {
  spawnp(
    androidAdbPath(),
    [
      'shell',
      'am',
      'start',
      '-n',
      `${packageName}/.${activityName}`,
      launchFlags,
    ],
    { detached: true },
  );
}

// Utility method to list all available android avd images (emulator images)
export async function getAndroidAvds() {
  const stdout = await execp(`${androidEmulatorPath()} -list-avds`);
  let avdArr: string[] = [];
  if (stdout) {
    avdArr = stdout.toString().trim().split(/\r?\n/);
  }
  return avdArr;
}

// Utility method to query what device instances are connected to the adb server
export async function getDevices(): Promise<string[]> {
  const stdout = await execp(`${androidAdbPath()} devices`);
  /*
    stdout for running command  $adb devices
    List of devices attached
    * daemon not running. starting it now at tcp:5037 *
    * daemon started successfully *
  */
  const stdOutArr = stdout.toString().trim().split(/\r?\n/);
  // remove stdout 'List of devices attached' (position 0)
  // and remove stdout related to daemon
  return stdOutArr.filter((entry, i) => i > 0 && !entry.includes('* daemon'));
}

export async function installApk(pathToApk: string) {
  return execp(`${androidAdbPath()} install -r ${pathToApk}`);
}

export function androidSdkRoot(): string | undefined {
  return process.env.ANDROID_SDK_ROOT ?? process.env.ANDROID_HOME;
}

export function androidAdbPath(): string {
  const sdkRoot = androidSdkRoot();
  return sdkRoot ? `${sdkRoot}/platform-tools/adb` : 'adb';
}

export function androidEmulatorPath(): string {
  const sdkRoot = androidSdkRoot();
  if (sdkRoot) {
    if (fs.existsSync(`${sdkRoot}/emulator/emulator`)) {
      return `${sdkRoot}/emulator/emulator`;
    }
    if (fs.existsSync(`${sdkRoot}/tools/emulator`)) {
      return `${sdkRoot}/tools/emulator`;
    }
  }
  return 'emulator';
}

/**
 * Returns the default Hermes engine (hermes-engine) package version used by a given React Native version.
 * Only works for versions of RN >= 0.60.0 as hermes-engine package was introduced in this version.
 */
export function getDefaultHermesVersion(
  reactNativeVersion: string,
): string | never {
  if (semver.gte(reactNativeVersion, '0.66.0')) {
    // https://github.com/facebook/react-native/blob/v0.66.0/package.json#L98
    return '~0.9.0';
  } else if (semver.gte(reactNativeVersion, '0.65.0')) {
    // https://github.com/facebook/react-native/blob/v0.65.0/package.json#L98
    return '~0.8.1';
  } else if (semver.gte(reactNativeVersion, '0.64.0')) {
    // https://github.com/facebook/react-native/blob/v0.64.0/package.json#L97
    return '~0.7.0';
  } else if (semver.gte(reactNativeVersion, '0.63.0')) {
    // https://github.com/facebook/react-native/blob/v0.63.0/package.json#L98
    return '~0.5.0';
  } else if (semver.gte(reactNativeVersion, '0.62.0')) {
    return '~0.4.0';
  } else if (semver.gte(reactNativeVersion, '0.60.0')) {
    return '^0.2.1';
  } else {
    throw new Error(
      'This function can only be called for versions of React Native >= 0.60.0',
    );
  }
}

/**
 * Returns the default JavaScriptCore engine version used
 * by a given React Native version.
 * Only works for versions of RN >= 0.60.0 as dynamic jsc-android
 * package was introduced in this version.
 */
export function getDefaultJSCVersion(
  reactNativeVersion: string,
): string | never {
  if (semver.gte(reactNativeVersion, '0.65.0')) {
    return '^250230.2.1';
  } else if (semver.gte(reactNativeVersion, '0.61.0')) {
    return '^245459.0.0';
  } else if (semver.gte(reactNativeVersion, '0.60.0')) {
    return '245459.0.0';
  } else {
    throw new Error(
      'This function can only be called for versions of React Native >= 0.60.0',
    );
  }
}
