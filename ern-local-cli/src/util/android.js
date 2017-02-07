const child_process = require('child_process');
const exec = child_process.exec;
import inquirer from 'inquirer';
import shell from 'shelljs';
import { spin } from './spin.js';
const log = require('console-log-level')();

//==============================================================================
// Misc utilities
//==============================================================================

//
// Returns a promise that will get resolved after a given delay (in ms)
async function delay(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}

//==============================================================================
// Core android stuff
//==============================================================================

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
export async function runAndroid({
  projectPath,
  packageName
}) {
  const devices = await getDevices();
  if(devices.length === 1){
    //If 1 device is running install and launch the application
    log.info(devices[0].split('\t')[0], ' is running ...');
    installAndLaunchApp(projectPath, packageName);
  }
  else if (devices.length > 1) {
    log.error('error: more than one device/emulator');
  }
  else {
    const avdImageNames = await getAndroidAvds();
    inquirer.prompt([{
      type: 'list',
      name: 'avdImageName',
      message: 'Choose Android emulator image',
      choices: avdImageNames
    }]).then(answers => {
       runAndroidUsingAvdImage(projectPath, packageName, answers.avdImageName);
    });
  }
}

// Does the job of actually running the app
// It orchestrates a few tasks to actually get the job done
// Params :
// - projectPath : Absolute or relative path to the root of the Android projectPath
// - packageName : name of the package containing the application
// - avdImageName : name of the avd image to use (emulator image)
async function runAndroidUsingAvdImage(projectPath, packageName, avdImageName) {
  exec(`emulator -avd ${avdImageName}`);
  await spin('Waiting for device to start', waitForAndroidDevice());
  installAndLaunchApp(projectPath, packageName);
}

// Does the job of installing and running the app
// It orchestrates a few tasks to actually get the job done
// Params :
// - projectPath : Absolute or relative path to the root of the Android projectPath
// - packageName : name of the package containing the application
async function installAndLaunchApp(projectPath, packageName) {
  await spin('Installing application', installApp(projectPath));
  await spin('Launching application',
    launchAndroidActivity(packageName, "MainActivity"));
}

// Utility method that basically completes whenever the android device is ready
// It check device readiness every 2 sec (poll way)
async function waitForAndroidDevice() {
  let androidBootAnimProp = await androidGetBootAnimProp();
  while (!androidBootAnimProp.startsWith('stopped')) {
    await delay(2000);
    androidBootAnimProp = await androidGetBootAnimProp();
  }
}

// Utility method to know when the prop init.svc.bootanim is there
// which indicates somehow that device is ready to install APK and such
async function androidGetBootAnimProp() {
  return new Promise((resolve, reject) => {
    exec(`${androidAdbPath()} wait-for-device shell getprop init.svc.bootanim`,
      (err, stdout, stderr) => {
      if (err || stderr) {
        log.error(err ? err : stderr);
        reject(err ? err : stderr);
      } else {
        resolve(stdout);
      }
    });
  });
}

// Build & install application on the device
// params :
// - projectPath : Absolute or relative path to the root of the Android project
// containing the application
async function installApp(projectPath) {
  return new Promise((resolve, reject) => {
    shell.cd(projectPath);
    exec(`./gradlew installDebug`,
      (err, stdout, stderr) => {
      if (err || stderr) {
        log.error(err ? err : stderr);
        reject(err ? err : stderr);
      } else {
        resolve(stdout);
      }
    });
  });
}

// Utility method to launch a specific activity in a given package
// Params :
// - packageName : name of the package containing the application
// - activityName : name of the Activity to launch
async function launchAndroidActivity(packageName, activityName) {
  return new Promise((resolve, reject) => {
    exec(`${androidAdbPath()} shell am start -n ${packageName}/.${activityName}`,
      (err, stdout, stderr) => {
      if (err || stderr) {
        reject(err ? err : stderr);
      } else {
        resolve();
      }
    });
  })
}

// Utility method to list all available android avd images (emulator images)
async function getAndroidAvds() {
  return new Promise((resolve, reject) => {
    exec(`${androidEmulatorPath()} -list-avds`, (err, stdout, stderr) => {
      if (err || stderr) {
        reject(err ? err : stderr);
      } else {
        resolve(stdout.trim().split('\n'));
      }
    });
  })
}

//Utility method to query what device instances are connected to the adb server
async function getDevices() {
  return new Promise((resolve, reject) => {
    exec(`${androidAdbPath()} devices`, (err, stdout, stderr) => {
      if (err || stderr) {
        reject(err ? err : stderr);
      } else {
        const deviceList = stdout.trim().split('\n');
        resolve(deviceList.splice(1, deviceList.length));
      }
    });
  })
}

function androidAdbPath() {
  return process.env.ANDROID_HOME
    ? `${process.env.ANDROID_HOME}/platform-tools/adb`
    : 'adb';
}

function androidEmulatorPath() {
  return process.env.ANDROID_HOME
    ? `${process.env.ANDROID_HOME}/tools/emulator`
    : 'emulator';
}

//==============================================================================
// Following code is not in use ! It was done at some point when we wanted
// to launch the real native application binary instead of the runner project
// We keep it here, as we might want to bring back this feature
//==============================================================================

/*async function runAndroid() {
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
}*/
