import { AppVersionDescriptor, log } from 'ern-core';
import { getActiveCauldron } from 'ern-cauldron-api';
import {
  epilog,
  logErrorAndExitIfNotSatisfied,
  tryCatchWrap,
} from '../../../lib';
import { Argv } from 'yargs';

export const command = 'nativeapp <descriptor> [isReleased]';
export const desc = 'Update a native application info in cauldron';

export const builder = (argv: Argv) => {
  return argv
    .option('description', {
      describe: 'Description of the native application version',
      type: 'string',
    })
    .coerce('descriptor', (d) => AppVersionDescriptor.fromString(d))
    .option('isReleased', {
      alias: 'r',
      default: undefined,
      describe: 'true if version is released, false otherwise',
      type: 'boolean',
    })
    .epilog(epilog(exports));
};

export const commandHandler = async ({
  description,
  descriptor,
  isReleased,
}: {
  description?: string;
  descriptor: AppVersionDescriptor;
  isReleased?: boolean;
}) => {
  await logErrorAndExitIfNotSatisfied({
    napDescriptorExistInCauldron: {
      descriptor,
      extraErrorMessage:
        'You cannot update the release status of a non existing native application version',
    },
  });

  const cauldron = await getActiveCauldron();
  if (isReleased !== undefined) {
    await cauldron.updateNativeAppIsReleased(descriptor, isReleased);
    log.info(`Successfully updated release status of ${descriptor}`);
  }
  if (description) {
    await cauldron.addOrUpdateDescription(descriptor, description);
    log.info(`Successfully updated description of ${descriptor}`);
  }
};

export const handler = tryCatchWrap(commandHandler);
