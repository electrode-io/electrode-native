const child_process = require('child_process');
const exec = child_process.exec;
import inquirer from 'inquirer';
import shell from 'shelljs';
import spin from './spin.js';
import { logError } from './log.js';

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

export async function runAndroid({
  projectPath,
  packageName
}) {
  const avdImageNames = await getAndroidAvds();

  inquirer.prompt([{
    type: 'list',
    name: 'avdImageName',
    message: 'Choose Android emulator image',
    choices: avdImageNames
  }]).then(answers => {
     doRunAndroid(projectPath, packageName, answers.avdImageName);
  });
}

async function doRunAndroid(projectPath, packageName, avdImageName) {
  exec(`emulator -avd ${avdImageName}`);
  await spin('Waiting for device to start', waitForAndroidDevice());
  await spin('Installing application', installApp(projectPath));
  await spin('Launching application',
    launchAndroidActivity(packageName, "MainActivity"));
}

async function androidGetBootAnimProp() {
  return new Promise((resolve, reject) => {
    exec(`adb wait-for-device shell getprop init.svc.bootanim`,
      (err, stdout, stderr) => {
      if (err || stderr) {
        logError(err ? err : stderr);
        reject(err ? err : stderr);
      } else {
        resolve(stdout);
      }
    });
  });
}

async function installApp(projectPath) {
  return new Promise((resolve, reject) => {
    shell.cd(projectPath);
    exec(`./gradlew installDebug`,
      (err, stdout, stderr) => {
      if (err || stderr) {
        logError(err ? err : stderr);
        reject(err ? err : stderr);
      } else {
        resolve(stdout);
      }
    });
  });
}

async function launchAndroidActivity(packageName, activityName) {
  return new Promise((resolve, reject) => {
    exec(`adb shell am start -n ${packageName}/.${activityName}`,
      (err, stdout, stderr) => {
      if (err || stderr) {
        reject(err ? err : stderr);
      } else {
        resolve();
      }
    });
  })
}

async function waitForAndroidDevice() {
  let androidBootAnimProp = await androidGetBootAnimProp();
  while (!androidBootAnimProp.startsWith('stopped')) {
    await delay(2000);
    androidBootAnimProp = await androidGetBootAnimProp();
  }
}

async function getAndroidAvds() {
  return new Promise((resolve, reject) => {
    exec('emulator -list-avds', (err, stdout, stderr) => {
      if (err || stderr) {
        reject(err ? err : stderr);
      } else {
        resolve(stdout.trim().split('\n'));
      }
    });
  })
}

//==============================================================================
// Following code is not in use ! It was done at some point when we wanted
// to launch the real native application binary instead of the runner project
// We keep it here, as we might want to bring back this feature
//==============================================================================

/*async function runAndroid() {
  let compatibleVersions = [];
  let compatibilityReport =
    await getCompatibilityReport({ platformName: 'android' });

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
