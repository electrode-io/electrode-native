import _ from 'lodash';
import chalk from 'chalk';
import Table from 'cli-table';
const log = require('console-log-level')();
import cauldron from './cauldron.js';
import { spin } from './spin.js';
import { getLocalNativeDependencies } from './miniapp.js'
import platform from './platform.js';

export async function nativeCompatCheck(verbose, appName, platformName, versionName) {
  let compatReport = await spin("Checking compatibility",
    getNativeAppCompatibilityReport({appName, platformName, versionName}));

  for (let r of compatReport) {
    const isCompatible = r.compatibility.incompatible.length === 0;
    log.info(chalk.magenta(`${r.appName}:${r.appPlatform}:${r.appVersion}`) + " : "
      + (isCompatible ? chalk.green("COMPATIBLE") : chalk.red("NOT COMPATIBLE")));

    if (verbose) {
      logCompatibilityReportTable(r.compatibility);
    }

    // Special case, if it was a check for a single instance (app+platform+version)
    // then return true or false to denote compat with this instance or not
    if (appName && platformName && versionName) {
      return isCompatible;
    }
  }
}

export function platformCompatCheck(verbose, platformVersion) {
  const localNativeDeps = getLocalNativeDependencies();
  const platformDependencies = platform.getSupportedPlugins(platformVersion);

  const report = getCompatibility(localNativeDeps, platformDependencies);
  const isCompatible = report.incompatible.length === 0;

  log.info(isCompatible ? chalk.green("COMPATIBLE") : chalk.red("NOT COMPATIBLE"));

  if (verbose) {
    logCompatibilityReportTable(report);
  }
}

export async function logCompatibilityReportTable(report) {
  var table = new Table({
      head: [ chalk.cyan('Scope'),
              chalk.cyan('Name'),
              chalk.cyan('Ext Version'),
              chalk.cyan('Local Version') ],
      colWidths: [10, 40, 15, 15]
  });

  for (const compatibleEntry of report.compatible) {
    table.push([
      compatibleEntry.scope ? compatibleEntry.scope : '',
      compatibleEntry.dependencyName,
      chalk.green(compatibleEntry.remoteVersion ? compatibleEntry.remoteVersion : ''),
      chalk.green(compatibleEntry.localVersion ? compatibleEntry.localVersion : '')
    ]);
  }

  for (const incompatibleEntry of report.incompatible) {
    table.push([
      incompatibleEntry.scope ? incompatibleEntry.scope : '',
      incompatibleEntry.dependencyName,
      incompatibleEntry.remoteVersion,
      chalk.red(incompatibleEntry.localVersion)
    ]);
  }

  log.info(table.toString());
}

export async function getNativeAppCompatibilityReport({ appName, platformName, versionName } = {}) {
  let result = [];
  const nativeApps = await cauldron.getAllNativeApps();

  // I so love building pyramids !!! :P
  for (const nativeApp of nativeApps) {
    if ((!appName) || (nativeApp.name === appName)) {
      for (const nativeAppPlatform of nativeApp.platforms) {
        if ((!platformName) || (nativeAppPlatform.name === platformName)) {
          for (const nativeAppVersion of nativeAppPlatform.versions) {
            if ((!versionName) || (nativeAppVersion.name === versionName)) {
              result.push({
                appName: nativeApp.name,
                appPlatform: nativeAppPlatform.name,
                appVersion: nativeAppVersion.name,
                appBinary: nativeAppVersion.binary,
                compatibility: getCompatibility(getLocalNativeDependencies(),
                  nativeAppVersion.nativeDeps)
              });
            }
          }
        }
      }
    }
  }

  return result;
}

//
// Get a compatibility object containing the compatibility result
// from comparing an array of dependencies (localDeps) against anoter
// array of dependencies (remoteDeps)
//
// Input : localDeps/remoteDeps sample array :
//
// [{
//   name: "react-native-electrode-bridge",
//   scope: "walmart",
//   version: "1.0.0"
// }]
//
// Output object example :
//
// {
//   compatible: [
//     {
//       dependencyName: "react-native-electrode-bridge",
//       scope: "walmart",
//       localVersion: "1.0.0",
//       remoteVersion: "1.0.0"
//     }
//   ],
//   incompatible: [
//     {
//       dependencyName: "react-native",
//       localVersion: "0.38.2",
//       remoteVersion: "0.40.0"
//     }
//   ]
// }
export function getCompatibility(localDeps, remoteDeps) {
  let result = { compatible: [], incompatible: [] };

  for (const remoteDep of remoteDeps) {
    const localDep = _.find(localDeps,
      d => (d.name === remoteDep.name) && (d.scope === remoteDep.scope));
    const localDepVersion = localDep ? localDep.version : undefined;

    let entry = {
      dependencyName: remoteDep.name,
      scope: remoteDep.scope,
      localVersion: localDepVersion,
      remoteVersion: remoteDep.version };

    if ((localDepVersion) &&
       (localDepVersion !== remoteDep.version)) {
        result.incompatible.push(entry);
    } else if ((localDepVersion) &&
       (localDepVersion === remoteDep.version)) {
      result.compatible.push(entry);
    } else {
      result.compatible.push(entry);
    }
  }

  // all other deps are deemed compatible by default if the do not exists
  // remotely yet
  const localOnlyNativeDeps =
    _.differenceBy(localDeps, remoteDeps, 'name');

  for (const localOnlyNativeDep of localOnlyNativeDeps) {
    const dependencyName = localOnlyNativeDep.name;
    const localVersion = localOnlyNativeDep.version;
    let entry = { dependencyName, scope: localOnlyNativeDep.scope, localVersion };
    result.compatible.push(entry);
  }

  return result;
}
