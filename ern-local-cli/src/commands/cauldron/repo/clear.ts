import { cauldronRepositories } from 'ern-cauldron-api';
import { log } from 'ern-core';
import { epilog, tryCatchWrap } from '../../../lib';
import { Argv } from 'yargs';

export const command = 'clear';
export const desc = 'Do not use any Cauldron';

export const builder = (argv: Argv) => {
  return argv.epilog(epilog(exports));
};

export const commandHandler = async () => {
  cauldronRepositories.deactivate();
  log.info(`Succesfully cleared any active Cauldron`);
};

export const handler = tryCatchWrap(commandHandler);
