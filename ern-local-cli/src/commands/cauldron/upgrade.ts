import { log } from 'ern-core';
import { getActiveCauldron } from 'ern-cauldron-api';
import { Argv } from 'yargs';
import { tryCatchWrap } from '../../lib';

export const command = 'upgrade';
export const desc = 'Upgrade the Cauldron schema';
export const builder = (argv: Argv) => {
  return;
};
export const commandHandler = async () => {
  const cauldron = await getActiveCauldron({
    ignoreRequiredErnVersionMismatch: true,
    ignoreSchemaVersionMismatch: true,
  });
  await cauldron.upgradeCauldronSchema();
  log.info('Cauldron was successfully upgraded');
};

export const handler = tryCatchWrap(commandHandler);
