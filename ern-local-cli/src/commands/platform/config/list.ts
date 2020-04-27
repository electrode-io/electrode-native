import { Argv } from 'yargs';
import { epilog, tryCatchWrap } from '../../../lib';
import { config as ernConfig, log } from 'ern-core';

export const command = 'list';
export const desc = 'Show all the config settings';

export const builder = (argv: Argv) => {
  return argv.epilog(epilog(exports));
};

export const commandHandler = async () => {
  // TODO: Add tabular view
  log.info(JSON.stringify(ernConfig.get(), null, 2));
};

export const handler = tryCatchWrap(commandHandler);
