import { cauldronRepositories } from 'ern-cauldron-api';
import { log } from 'ern-core';
import { epilog, tryCatchWrap } from '../../../lib';
import { Argv } from 'yargs';

export const command = 'current';
export const desc = 'Display the currently activated Cauldron repository';

export const builder = (argv: Argv) => {
  return argv.epilog(epilog(exports));
};

export const commandHandler = async () => {
  const current = cauldronRepositories.current;
  if (!current) {
    throw new Error(`No Cauldron repository is in use yet`);
  }
  log.info(`${current.alias} [${current.url}]`);
};

export const handler = tryCatchWrap(commandHandler);
