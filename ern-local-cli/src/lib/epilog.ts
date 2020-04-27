import { Platform } from 'ern-core';
import _ from 'lodash';
import chalk from 'chalk';
import semver from 'semver';

export function epilog({ command }: { command: string }) {
  const version = `v${semver.major(Platform.currentVersion)}.${semver.minor(
    Platform.currentVersion,
  )}`;
  const rootUrl =
    Platform.currentVersion === '1000.0.0'
      ? `https://native.electrode.io/cli-commands`
      : `https://native.electrode.io/v/${version}/cli-commands`;
  const commandWithoutOptions = command.split(' ')[0];
  const idx = _.indexOf(process.argv, commandWithoutOptions);
  let commandPath = _.slice(process.argv, 2, idx).join('-');
  commandPath = commandPath ? `/${commandPath}` : '';
  return `More info about this command @ ${chalk.bold(
    `${rootUrl}${commandPath}/${commandWithoutOptions}.html`,
  )}`;
}
