import { AppVersionDescriptor, log } from 'ern-core';
import { getActiveCauldron } from 'ern-cauldron-api';
import {
  epilog,
  logErrorAndExitIfNotSatisfied,
  tryCatchWrap,
} from '../../../lib';
import { Argv } from 'yargs';

export const command = 'nativeapp <descriptor>';
export const desc = 'Remove a native application from the cauldron';

export const builder = (argv: Argv) => {
  return argv
    .coerce('descriptor', d => AppVersionDescriptor.fromString(d))
    .epilog(epilog(exports));
};

export const commandHandler = async ({
  descriptor,
}: {
  descriptor: AppVersionDescriptor;
}) => {
  await logErrorAndExitIfNotSatisfied({
    napDescriptorExistInCauldron: {
      descriptor,
      extraErrorMessage:
        'This command cannot remove a native application version that do not exist in Cauldron.',
    },
  });
  const cauldron = await getActiveCauldron();
  await cauldron.beginTransaction();
  await cauldron.delConfig(descriptor);
  await cauldron.removeDescriptor(descriptor);
  await cauldron.commitTransaction(`Remove ${descriptor}`);
  log.info(`${descriptor} successfully removed from the Cauldron`);
};

export const handler = tryCatchWrap(commandHandler);
