import { log, Platform, tagOneLine } from 'ern-core';
import chalk from 'chalk';
import { epilog, tryCatchWrap } from '../../lib';
import semver from 'semver';
import { Argv } from 'yargs';

const BASE_RELEASE_URL = `https://github.com/electrode-io/electrode-native/releases/tag`;

export const command = 'versions';
export const desc = 'List platform versions';

export const builder = (argv: Argv) => {
  return argv.epilog(epilog(exports));
};

export const commandHandler = async () => {
  log.info(tagOneLine`
    ${chalk.green('[CURRENT]')}
    ${chalk.yellow('[INSTALLED]')}
    ${chalk.gray('[NOT INSTALLED]')}`);
  for (const version of Platform.versions) {
    // Don't show versions pre 0.7.0 as it was not official public releases
    // Electrode Native initial public release was 0.7.0 so starting from
    // this version
    if (semver.lt(version, '0.7.0')) {
      continue;
    }
    if (Platform.isPlatformVersionInstalled(version)) {
      if (Platform.currentVersion === version) {
        log.info(
          chalk.green(`-> v${version}\t\t`) +
            chalk.white(`${BASE_RELEASE_URL}/v${version}`),
        );
      } else {
        log.info(
          chalk.yellow(`v${version}\t\t`) +
            chalk.white(`${BASE_RELEASE_URL}/v${version}`),
        );
      }
    } else {
      log.info(
        chalk.gray(`v${version}\t\t`) +
          chalk.white(`${BASE_RELEASE_URL}/v${version}`),
      );
    }
  }
};

export const handler = tryCatchWrap(commandHandler);
