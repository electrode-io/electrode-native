import { log, manifest, Platform } from 'ern-core';
import {
  epilog,
  logErrorAndExitIfNotSatisfied,
  tryCatchWrap,
} from '../../../lib';
import { Argv } from 'yargs';

import chalk from 'chalk';
import Table from 'cli-table';

export const command = 'list [platformVersion]';
export const desc = 'List supported platform plugins';

export const builder = (argv: Argv) => {
  return argv
    .option('manifestId', {
      describe: 'Manifest id for which to list support plugins',
      type: 'string',
    })
    .option('platformVersion', {
      alias: 'v',
      describe: 'Specific platform version for which to list supported plugins',
    })
    .epilog(epilog(exports));
};

export const commandHandler = async ({
  manifestId,
  platformVersion = Platform.currentVersion,
}: {
  manifestId?: string;
  platformVersion?: string;
}) => {
  if (manifestId) {
    await logErrorAndExitIfNotSatisfied({
      manifestIdExists: {
        id: manifestId,
      },
    });
  }

  const plugins = await manifest.getNativeDependencies({
    manifestId,
    platformVersion,
  });

  log.info(`Platform v${platformVersion} suports the following plugins`);
  const table = new Table({
    colWidths: [40, 16],
    head: [chalk.cyan('Name'), chalk.cyan('Version')],
  });
  for (const plugin of plugins) {
    table.push([plugin.name, plugin.version]);
  }
  log.info(table.toString());
};

export const handler = tryCatchWrap(commandHandler);
