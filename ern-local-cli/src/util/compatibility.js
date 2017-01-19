import _ from 'lodash';
import chalk from 'chalk';
import Table from 'cli-table';
import cauldron from './cauldron.js';
import { spin } from './spin.js';
import { getLocalNativeDependencies } from './miniapp.js'

export async function compatCheck(verbose, appName, platformName, versionName) {
  let compatReport = await spin("Checking compatibility",
    getCompatibilityReport({appName, platformName, versionName}));
  for (let r of compatReport) {
    var table = new Table({
        head: [ chalk.cyan('Native Dependency'),
                chalk.cyan('Native App Version'),
                chalk.cyan('Local Version') ],
        colWidths: [40, 20, 20]
    });
    const isCompatible = r.compatibility.incompatible.length === 0;
    console.log(chalk.magenta(`${r.appName}:${r.appPlatform}:${r.appVersion}`) + " : "
      + (isCompatible ? chalk.green("COMPATIBLE") : chalk.red("NOT COMPATIBLE")));

    if (verbose) {
      for (const compatibleEntry of r.compatibility.compatible) {
        table.push([
          compatibleEntry.dependencyName,
          chalk.green(compatibleEntry.nativeVersion ? compatibleEntry.nativeVersion : ""),
          chalk.green(compatibleEntry.localVersion)
        ]);
      }
      for (const incompatibleEntry of r.compatibility.incompatible) {
        table.push([
          incompatibleEntry.dependencyName,
          incompatibleEntry.nativeVersion,
          chalk.red(incompatibleEntry.localVersion)
        ]);
      }
      console.log(table.toString());
    }

    // Special case, if it was a check for a single instance (app+platform+version)
    // then return true or false to denote compat with this instance or not
    if (appName && platformName && versionName) {
      return isCompatible;
    }
  }
}

export async function getCompatibilityReport({ appName, platformName, versionName } = {}) {
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
                compatibility: getCompatibilityReportForNativeAppVersion(nativeAppVersion)
              });
            }
          }
        }
      }
    }
  }

  return result;
}

export function getCompatibilityReportForNativeAppVersion(nativeAppVersion) {
  let result = { compatible: [], incompatible: [] };
  const localNativeDependencies = getLocalNativeDependencies();

  // Check all deps currently in the cauldron
  for (const nativeDep of nativeAppVersion.nativeDeps) {
    const dependencyName = nativeDep.name;
    const nativeVersion = nativeDep.version;
    const localDep = _.find(localNativeDependencies, d => d.name === dependencyName);
    const localVersion = localDep ? localDep.version : undefined;

    let entry = { dependencyName, localVersion, nativeVersion };

    if ((localVersion) &&
       (localVersion !== nativeDep.version)) {
        result.incompatible.push(entry);
    } else if ((localVersion) &&
       (localVersion === nativeDep.version)) {
      result.compatible.push(entry);
    } else {
      result.compatible.push(entry);
    }
  }

  // all other deps (not in cauldron) are deemed compatible by default
  const localOnlyNativeDeps =
    _.differenceBy(localNativeDependencies, nativeAppVersion.nativeDeps, 'name');

  for (const localOnlyNativeDep of localOnlyNativeDeps) {
    const dependencyName = localOnlyNativeDep.name;
    const localVersion = localOnlyNativeDep.version;
    let entry = { dependencyName, localVersion };
    result.compatible.push(entry);
  }

  return result;
}


export function checkCompatibilityWithplatformVersion(version) {
  const localNativeDeps = getLocalNativeDependencies();
  const containerManifestDeps = getDependenciesFromContainerManifest(version);

  for (const localNativeDep of localNativeDeps) {
    const containerManifestMatchingDep =
      _.find(containerManifestDeps, m => m.name === localNativeDep.name);
    const localDep = `${localNativeDep.name}@${localNativeDep.version}`;
    if (containerManifestMatchingDep) {
      if (containerManifestMatchingDep.version === localNativeDep.version) {
        console.log(chalk.green(`${localDep} [MATCH]`));
      } else {
        console.log(chalk.yellow(
          `${localDep} [v${containerManifestMatchingDep.version} EXPECTED]`));
      }
    } else {
      console.log(chalk.red(`${localDep} [NOT IN CURRENT CONTAINER VERSION]`))
    }
  }
}
