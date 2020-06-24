import { log } from 'ern-core';
import { getActiveCauldron } from 'ern-cauldron-api';
import { epilog, tryCatchWrap } from '../../../lib';
import { Argv } from 'yargs';

export const command = 'file <cauldronFilePath>';
export const desc = 'Remove a file from the Cauldron';

export const builder = (argv: Argv) => argv.epilog(epilog(exports));

export const commandHandler = async ({
  cauldronFilePath,
}: {
  cauldronFilePath: string;
}) => {
  const cauldron = await getActiveCauldron();
  await cauldron.removeFile({ cauldronFilePath });
  log.info(`${cauldronFilePath} file successfully removed from the Cauldron`);
};

export const handler = tryCatchWrap(commandHandler);
