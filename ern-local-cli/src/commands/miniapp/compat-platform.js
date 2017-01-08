import _ from 'lodash';
import chalk from 'chalk';
import { getLocalNativeDependencies } from '../../util/miniapp.js';
import platform from '../../util/platform.js';

exports.command = 'compat-platform [platformVersion]'
exports.desc = 'Check the compatibility of the miniapp with platform current or specific version'

exports.builder = function(yargs) {
  return yargs
    .option('platformVersion', {
      alias: 'v',
      describe: 'Platform version to check compatibility with'
    });
}

exports.handler = function (argv) {
  const localNativeDeps = getLocalNativeDependencies();
  const platformDependencies = platform.getSupportedPlugins(argv.platformVersion);

  for (const localNativeDep of localNativeDeps) {
    const containerManifestMatchingDep =
      _.find(platformDependencies, m => m.name === localNativeDep.name);
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
