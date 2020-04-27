import { cauldronRepositories } from 'ern-cauldron-api';
import { log } from 'ern-core';
import { epilog, tryCatchWrap } from '../../../lib';
import { Argv } from 'yargs';

export const command = 'remove <alias>';
export const desc = 'Remove a cauldron repository given its alias';

export const builder = (argv: Argv) => {
  return argv.epilog(epilog(exports));
};

export const commandHandler = async ({ alias }: { alias: string }) => {
  cauldronRepositories.remove({ alias });
  log.info(`Removed Cauldron repository exists with alias ${alias}`);
};

export const handler = tryCatchWrap(commandHandler);
