// @flow

import exec from './exec'
import { spawn } from 'child_process'
import inquirer from 'inquirer'
import shell from 'shelljs'
import spin from './spin.js'

// ==============================================================================
// Misc utilities
// ==============================================================================

//
// Returns a promise that will get resolved after a given delay (in ms)
async function delay (ms: number) {
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
// Build and run a project on Android emulator
// The `devDebug` variant will be built and launched on an emulator selected by
// the user (this function prompts the user with a list of available avd to choose from)
// Assumptions :
// - devDebug variant exists in the project
// - activity to launch is named MainActivity
// Params :
// - projectPath : Absolute or relative path to the root of the Android projectPath
// - packageName : name of the package containing the application
export async function runAndroid ({
  projectPath,
  packageName
} : {
  projectPath: string,
  packageName: string
}) {
  const devices = await getDevices()
  if (devices.length === 1) {
        // If 1 device is running install and launch the application
    log.info(devices[0].split('\t')[0], ' is running ...')
    installAndLaunchApp(projectPath, packageName)
  } else if (devices.length > 1) {
    log.error('error: more than one device/emulator')
  } else {
    const avdImageNames = await getAndroidAvds()
    inquirer.prompt([{
      type: 'list',
      name: 'avdImageName',
      message: 'Choose Android emulator image',
      choices: avdImageNames
    }]).then(answers => {
      runAndroidUsingAvdImage(projectPath, packageName, answers.avdImageName)
    })
  }
}

// Does the job of actually running the app
// It orchestrates a few tasks to actually get the job done
// Params :
// - projectPath : Absolute or relative path to the root of the Android projectPath
// - packageName : name of the package containing the application
// - avdImageName : name of the avd image to use (emulator image)
export async function runAndroidUsingAvdImage (
  projectPath: string,
  packageName: string,
  avdImageName: string) {
  // https://issuetracker.google.com/issues/37137213
  exec(`${androidEmulatorPath()} -avd ${avdImageName}`)
  await spin('Waiting for device to start', waitForAndroidDevice())
  installAndLaunchApp(projectPath, packageName)
}

// Does the job of installing and running the app
// It orchestrates a few tasks to actually get the job done
// Params :
// - projectPath : Absolute or relative path to the root of the Android projectPath
// - packageName : name of the package containing the application
export async function installAndLaunchApp (
  projectPath: string,
  packageName: string) {
  await spin('Installing application', installApp(projectPath))
  await spin('Launching Android Application', Promise.resolve())
  launchAndroidActivityDetached(packageName, 'MainActivity', projectPath)
}

// Utility method that basically completes whenever the android device is ready
// It check device readiness every 2 sec (poll way)
export async function waitForAndroidDevice () {
  let androidBootAnimProp = await androidGetBootAnimProp()
  while (!androidBootAnimProp.startsWith('stopped')) {
    await delay(2000)
    androidBootAnimProp = await androidGetBootAnimProp()
  }
}

// Utility method to know when the prop init.svc.bootanim is there
// which indicates somehow that device is ready to install APK and such
export async function androidGetBootAnimProp () {
  return new Promise((resolve, reject) => {
    exec(`${androidAdbPath()} wait-for-device shell getprop init.svc.bootanim`,
            (err, stdout, stderr) => {
              if (err || stderr) {
                log.error(err || stderr)
                reject(err || stderr)
              } else {
                resolve(stdout)
              }
            })
  })
}

// Build & install application on the device
// params :
// - projectPath : Absolute or relative path to the root of the Android project
// containing the application
export async function installApp (projectPath: string) {
  return new Promise((resolve, reject) => {
    shell.cd(projectPath)
    exec(`./gradlew installDebug`,
            (err, stdout, stderr) => {
              if (err || stderr) {
                log.error(err || stderr)
                reject(err || stderr)
              } else {
                resolve(stdout)
              }
            })
  })
}

// Utility method to launch a specific activity in a given package
// Params :
// - packageName : name of the package containing the application
// - activityName : name of the Activity to launch
export async function launchAndroidActivity (
  packageName: string,
  activityName: string) {
  return new Promise((resolve, reject) => {
    exec(`${androidAdbPath()} shell am start -n ${packageName}/.${activityName}`,
            (err, stdout, stderr) => {
              if (err || stderr) {
                reject(err || stderr)
              } else {
                resolve()
              }
            })
  })
}

// Utility method to launch a specific activity from a given packager
// Will spawn the command (detached mode)
export async function launchAndroidActivityDetached (
  packageName: string,
  activityName: string,
  cwd: string) {
  const adbShellCommand = spawn(androidAdbPath(),
      [ 'shell', 'am', 'start', '-n', `${packageName}/.${activityName}` ],
    { cwd })

  adbShellCommand.stderr.on('data', (data) => {
    log.error(`${data}`)
  })
}

// Utility method to list all available android avd images (emulator images)
export async function getAndroidAvds () {
  return new Promise((resolve, reject) => {
    exec(`${androidEmulatorPath()} -list-avds`, (err, stdout, stderr) => {
      if (err || stderr) {
        reject(err || stderr)
      } else {
        resolve(stdout.trim().split('\n'))
      }
    })
  })
}

// Utility method to query what device instances are connected to the adb server
export async function getDevices () {
  return new Promise((resolve, reject) => {
    exec(`${androidAdbPath()} devices`, (err, stdout, stderr) => {
      if (err || stderr) {
        reject(err || stderr)
      } else {
        /*
         stdout for running command  $adb devices
         List of devices attached
         * daemon not running. starting it now at tcp:5037 *
         * daemon started successfully *
        */
        let stdOutArr = stdout.trim().split('\n')
        stdOutArr.splice(0, 1) // remove stdout 'List of devices attached'
        let result = []
        // remove stdout related to daemon
        stdOutArr.forEach((entry) => {
          if (!entry.includes('* daemon')) {
            result.push(entry)
          }
        })
        resolve(result)
      }
    })
  })
}

export function androidAdbPath () : string {
  return process.env.ANDROID_HOME
        ? `${process.env.ANDROID_HOME}/platform-tools/adb`
        : 'adb'
}

export function androidEmulatorPath () : string {
  return process.env.ANDROID_HOME
        ? `${process.env.ANDROID_HOME}/tools/emulator`
        : 'emulator'
}

// ==============================================================================
// Following code is not in use ! It was done at some point when we wanted
// to launch the real native application binary instead of the runner project
// We keep it here, as we might want to bring back this feature
// ==============================================================================

/* async function runAndroid() {
 let compatibleVersions = [];
 let compatibilityReport =
 await getNativeAppCompatibilityReport({ platformName: 'android' });

 for (const app of compatibilityReport) {
 if (app.compatibility.incompatible.length === 0) {
 compatibleVersions.push(
 `${app.appName}:${app.appPlatform}:${app.appVersion}:${app.appBinary}`);
 }
 }

 let avdImageNames = await getAndroidAvds();

 inquirer.prompt([{
 type: 'list',
 name: 'nativeAppBinaryVersion',
 message: 'Choose compatible version to launch',
 choices: compatibleVersions
 }, {
 type: 'list',
 name: 'avdImageName',
 message: 'Choose Android emulator image',
 choices: avdImageNames
 }]).then(answers => {
 doRunAndroid(answers.nativeAppBinaryVersion, answers.avdImageName);
 });
 }

 async function doRunAndroid(nativeAppBinaryVersion, avdImageName) {
 let x = explodeBinaryFilename(nativeAppBinaryVersion);
 if (!isBinaryInCache(x.app, x.platform, x.version, x.hash)) {
 const appBinary = await cauldron.getNativeAppBinary(x.app, x.platform, x.version);
 fs.writeFileSync(`${CACHE_PATH}/binaries/\
 ${buildBinaryFileName(x.app, x.platform, x.version, x.hash)}`, appBinary, 'ascii');
 }

 const pathToApk = `${CACHE_PATH}/binaries/\
 ${buildBinaryFileName(x.app, x.platform, x.version, x.hash)}`;
 exec(`emulator -avd ${avdImageName}`);
 await spin('Waiting for device to start', waitForAndroidDevice());
 await spin('Installing APK', installApk(pathToApk));
 await spin('Launching application',
 launchAndroidActivity("com.walmart.android.cauldrontestapp", "MainActivity"));
 }

 //
 // Given a binary file name, explode it to get back
 // details about the binary
 function explodeBinaryFilename(binaryFilename) {
 const explodedBinaryFilename = binaryFilename.split(':');
 return {
 app: explodedBinaryFilename[0],
 platform: explodedBinaryFilename[1],
 version: explodedBinaryFilename[2],
 hash: explodedBinaryFilename[3]
 };
 }

 //
 // Return binary file name
 // Format : app:platform:version:hash.apk
 function buildBinaryFileName(app, platform, version, hash) {
 return `${app}:${platform}:${version}:${hash}.${platform === 'android' ? 'apk' : 'app'}`;
 }

 function isBinaryInCache(app, platform, version, hash) {
 try {
 fs.statSync(`${CACHE_PATH}/binaries/\
 ${buildBinaryFileName(app, platform, version, hash)}`);
 return true;
 } catch (e) {
 }

 return false;
 } */
