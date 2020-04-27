import { cauldronRepositories } from 'ern-cauldron-api';
import { log } from 'ern-core';
import { epilog, tryCatchWrap } from '../../../lib';
import { Argv } from 'yargs';

export const command = 'use <alias>';
export const desc = 'Select a Cauldron repository to use';

export const builder = (argv: Argv) => {
  return argv.epilog(epilog(exports));
};

export const commandHandler = async ({ alias }: { alias: string }) => {
  cauldronRepositories.activate({ alias });
  log.info(`${alias} Cauldron is now activated`);
};

export const handler = tryCatchWrap(commandHandler);
