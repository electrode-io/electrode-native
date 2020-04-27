import { cauldronRepositories } from 'ern-cauldron-api';
import { log } from 'ern-core';
import { epilog, tryCatchWrap } from '../../../lib';
import { Argv } from 'yargs';

export const command = 'list';
export const desc = 'List all Cauldron repositories';

export const builder = (argv: Argv) => {
  return argv.epilog(epilog(exports));
};

export const commandHandler = async () => {
  const repositories = cauldronRepositories.list();
  if (!repositories) {
    throw new Error('No Cauldron repositories have been added yet');
  }
  log.info('[Cauldron Repositories]');
  repositories.forEach(repo => log.info(`${repo.alias} -> ${repo.url}`));
};

export const handler = tryCatchWrap(commandHandler);
