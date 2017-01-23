import _ from 'lodash';
import chalk from 'chalk';
const log = require('console-log-level')();
import { getLocalNativeDependencies } from '../../util/miniapp.js';
import platform from '../../util/platform.js';

exports.command = 'upgrade <platformVersion>'
exports.desc = 'Upgrade the mini app to a specific platform version'

exports.builder = function(yargs) {
  return yargs
    .option('platformVersion', {
      alias: 'v',
      describe: 'Platform version to check compatibility with'
    });
}

exports.handler = function (argv) {
  const localNativeDeps = getLocalNativeDependencies();
  const platformDependencies = platform.getSupportedDependencies(argv.platformVersion);

  for (const localNativeDep of localNativeDeps) {
    const containerManifestMatchingDep =
      _.find(platformDependencies, m => m.name === localNativeDep.name);
    const localDep = `${localNativeDep.name}@${localNativeDep.version}`;
    if (containerManifestMatchingDep) {
      if (containerManifestMatchingDep.version === localNativeDep.version) {
        log.info(chalk.green(`${localDep} [MATCH]`));
      } else {
        log.info(chalk.yellow(
          `${localDep} [v${containerManifestMatchingDep.version} EXPECTED]`));
      }
    } else {
      log.info(chalk.red(`${localDep} [NOT IN CURRENT CONTAINER VERSION]`))
    }
  }
}
