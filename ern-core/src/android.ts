import inquirer from 'inquirer'
import shell from './shell'
import ernConfig from './config'
import * as deviceConfigUtil from './deviceConfig'
import log from './log'
import { execp, spawnp } from './childProcess'
import os from 'os'
import kax from './kax'

// ==============================================================================
// Default value for android build config
// ==============================================================================

export const DEFAULT_ANDROID_GRADLE_PLUGIN_VERSION = '3.2.1'
export const DEFAULT_BUILD_TOOLS_VERSION = '28.0.3'
export const DEFAULT_COMPILE_SDK_VERSION = '28'
export const DEFAULT_GRADLE_DISTRIBUTION_URL = '4.6'
export const DEFAULT_MIN_SDK_VERSION = '19'
export const DEFAULT_TARGET_SDK_VERSION = '28'

// ==============================================================================
// Misc utilities
// ==============================================================================

//
// Returns a promise that will get resolved after a given delay (in ms)
async function delay(ms: number) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve()
    }, ms)
  })
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
// - projectPath : Absolute or relative path to the root of the Android projectPath
// - packageName : Name of the package containing the application
// Options :
// - activityName : The name of the Activity to start (default "MainActivity")
export async function runAndroidProject({
  projectPath,
  packageName,
  activityName = 'MainActivity',
}: {
  projectPath: string
  packageName: string
  activityName?: string
}) {
  return runAndroid({
    activityName,
    packageName,
    projectPath,
  })
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
  apkPath,
  packageName,
  activityName = 'MainActivity',
}: {
  apkPath: string
  packageName: string
  activityName?: string
}) {
  return runAndroid({
    activityName,
    apkPath,
    packageName,
  })
}

export async function runAndroid({
  packageName,
  activityName,
  apkPath,
  projectPath,
}: {
  packageName: string
  activityName: string
  apkPath?: string
  projectPath?: string
}) {
  const devices = await getDevices()
  // install and launch the app if 1 emulator instance is running
  if (devices.length === 1) {
    log.debug(`${devices[0].split('\t')[0]} is running ...`)
    await installAndLaunchApp({
      activityName,
      apkPath,
      packageName,
      projectPath,
    })
  } else if (devices.length > 1) {
    throw new Error('More than one device/emulator is running !')
  } else {
    const avdImageName = await askUserToSelectAvdEmulator()
    return runAndroidUsingAvdImage({
      activityName,
      avdImageName,
      packageName,
      projectPath,
    })
  }
}

export async function askUserToSelectAvdEmulator(): Promise<string> {
  const avdImageNames = await getAndroidAvds()
  const deviceConfig = ernConfig.getValue(
    deviceConfigUtil.ANDROID_DEVICE_CONFIG
  )
  // Check if user has set the usePreviousEmulator flag to true
  if (avdImageNames && deviceConfig) {
    if (deviceConfig.usePreviousDevice) {
      // Get the name of previously used device
      const deviceId = deviceConfig.deviceId
      // Check if avd image still exists
      const avdIndex = avdImageNames.indexOf(deviceId)
      if (avdIndex > -1) {
        return `${avdImageNames[avdIndex]}`
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
  ])

  // Update the device Config
  if (deviceConfig) {
    deviceConfig.deviceId = avdImageName
    ernConfig.setValue(deviceConfigUtil.ANDROID_DEVICE_CONFIG, deviceConfig)
  }
  return `${avdImageName}`
}

// Does the job of actually running the app
// It orchestrates a few tasks to actually get the job done
// Params :
// - projectPath : Absolute or relative path to the root of the Android projectPath
// - packageName : name of the package containing the application
// - avdImageName : name of the avd image to use (device image)
export async function runAndroidUsingAvdImage({
  projectPath,
  packageName,
  avdImageName,
  activityName,
}: {
  projectPath?: string
  packageName: string
  avdImageName: string
  activityName: string
}) {
  // https://issuetracker.google.com/issues/37137213
  spawnp(androidEmulatorPath(), ['-avd', avdImageName], { detached: true })

  await kax.task('Waiting for device to start').run(waitForAndroidDevice())
  await installAndLaunchApp({ projectPath, packageName, activityName })
}

// Does the job of installing and running the app
// It orchestrates a few tasks to actually get the job done
// Params :
// - projectPath : Absolute or relative path to the root of the Android projectPath
// - packageName : name of the package containing the application
export async function installAndLaunchApp({
  projectPath,
  apkPath,
  packageName,
  activityName,
}: {
  projectPath?: string
  apkPath?: string
  packageName: string
  activityName: string
}) {
  if (projectPath) {
    await kax
      .task('Building and installing application')
      .run(buildAndInstallApp(projectPath))
  } else if (apkPath) {
    await kax.task('Installing APK').run(installApk(apkPath))
  }
  await kax.task('Launching Android Application').run(Promise.resolve())
  launchAndroidActivityDetached(packageName, activityName)
}

// Utility method that basically completes whenever the android device is ready
// It check device readiness every 2 sec (poll way)
export async function waitForAndroidDevice() {
  let androidBootAnimProp = await androidGetBootAnimProp()
  while (!androidBootAnimProp.toString().startsWith('stopped')) {
    await delay(2000)
    androidBootAnimProp = await androidGetBootAnimProp()
  }
}

// Utility method to know when the prop init.svc.bootanim is there
// which indicates somehow that device is ready to install APK and such
export async function androidGetBootAnimProp() {
  return execp(
    `${androidAdbPath()} wait-for-device shell getprop init.svc.bootanim`
  )
}

// Build & install application on the device
// params :
// - projectPath : Absolute or relative path to the root of the Android project
// containing the application
export async function buildAndInstallApp(projectPath: string) {
  shell.pushd(projectPath)
  try {
    const gradlew = getGradleByPlatform()
    return execp(`${gradlew} installDebug`)
  } finally {
    shell.popd()
  }
}

export function getGradleByPlatform(): string {
  return /^win/.test(process.platform) ? 'gradlew' : './gradlew'
}

// Utility method to launch a specific activity from a given package
// Params :
// - packageName : name of the package containing the application
// - activityName : name of the Activity to launch
export async function launchAndroidActivity(
  packageName: string,
  activityName: string
) {
  return execp(
    `${androidAdbPath()} shell am start -n ${packageName}/.${activityName}`
  )
}

// Utility method to launch a specific activity from a given packager
// Will spawn the command (detached mode)
export function launchAndroidActivityDetached(
  packageName: string,
  activityName: string
) {
  spawnp(
    androidAdbPath(),
    ['shell', 'am', 'start', '-n', `${packageName}/.${activityName}`],
    { detached: true }
  )
}

// Utility method to list all available android avd images (emulator images)
export async function getAndroidAvds() {
  const stdout = await execp(`${androidEmulatorPath()} -list-avds`)
  return stdout
    .toString()
    .trim()
    .split(os.EOL)
}

// Utility method to query what device instances are connected to the adb server
export async function getDevices(): Promise<string[]> {
  const stdout = await execp(`${androidAdbPath()} devices`)
  /*
    stdout for running command  $adb devices
    List of devices attached
    * daemon not running. starting it now at tcp:5037 *
    * daemon started successfully *
  */
  const stdOutArr = stdout
    .toString()
    .trim()
    .split(os.EOL)
  // remove stdout 'List of devices attached' (position 0)
  // and remove stdout related to daemon
  return stdOutArr.filter((entry, i) => i > 0 && !entry.includes('* daemon'))
}

export async function installApk(pathToApk: string) {
  return execp(`${androidAdbPath()} install -r ${pathToApk}`)
}

export function androidAdbPath(): string {
  return process.env.ANDROID_HOME
    ? `${process.env.ANDROID_HOME}/platform-tools/adb`
    : 'adb'
}

export function androidEmulatorPath(): string {
  return process.env.ANDROID_HOME
    ? `${process.env.ANDROID_HOME}/tools/emulator`
    : 'emulator'
}
