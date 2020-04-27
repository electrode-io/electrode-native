import { AppVersionDescriptor, log } from 'ern-core';
import { getActiveCauldron } from 'ern-cauldron-api';
import {
  epilog,
  logErrorAndExitIfNotSatisfied,
  tryCatchWrap,
} from '../../../lib';
import { Argv } from 'yargs';

export const command = 'dependency <descriptor>';
export const desc =
  'Get all the native dependencies of a given native application';

export const builder = (argv: Argv) => {
  return argv
    .coerce('descriptor', d => AppVersionDescriptor.fromString(d))
    .option('json', {
      describe: 'Output dependencies as a single line JSON array',
      type: 'boolean',
    })
    .epilog(epilog(exports));
};

export const commandHandler = async ({
  descriptor,
  json,
}: {
  descriptor: AppVersionDescriptor;
  json?: boolean;
}) => {
  await logErrorAndExitIfNotSatisfied({
    napDescriptorExistInCauldron: {
      descriptor,
      extraErrorMessage:
        'This command cannot work on a non existing native application version',
    },
  });

  const cauldron = await getActiveCauldron();
  const dependencies = await cauldron.getNativeDependencies(descriptor);
  json
    ? process.stdout.write(JSON.stringify(dependencies))
    : dependencies.forEach(d => log.info(d.toString()));
};

export const handler = tryCatchWrap(commandHandler);
