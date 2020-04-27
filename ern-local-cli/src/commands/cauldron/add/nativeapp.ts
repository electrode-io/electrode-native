import { getActiveCauldron } from 'ern-cauldron-api';
import {
  AppPlatformDescriptor,
  AppVersionDescriptor,
  kax,
  log,
} from 'ern-core';
import { parseJsonFromStringOrFile } from 'ern-orchestrator';
import {
  askUserConfirmation,
  epilog,
  logErrorAndExitIfNotSatisfied,
  tryCatchWrap,
} from '../../../lib';
import { Argv } from 'yargs';

export const command = 'nativeapp <descriptor>';
export const desc = 'Add a native application to the cauldron';

export const builder = (argv: Argv) => {
  return argv
    .option('copyFromVersion', {
      alias: 'c',
      describe: 'Copy Cauldron data from a previous native application version',
      type: 'string',
    })
    .option('description', {
      describe: 'Description of the native application version',
      type: 'string',
    })
    .coerce('descriptor', d => AppVersionDescriptor.fromString(d))
    .option('platformVersion', {
      alias: 'v',
      describe: 'Use specified platform version',
    })
    .option('config', {
      describe: 'Configuration to use for this native application version',
      type: 'string',
    })
    .epilog(epilog(exports));
};

export const commandHandler = async ({
  config,
  copyFromVersion,
  description,
  descriptor,
}: {
  config?: string;
  copyFromVersion?: string;
  description?: string;
  descriptor: AppVersionDescriptor;
}) => {
  let cauldron;

  await logErrorAndExitIfNotSatisfied({
    napDescritorDoesNotExistsInCauldron: {
      descriptor,
      extraErrorMessage:
        'This version of the native application already exist in Cauldron.',
    },
  });

  cauldron = await getActiveCauldron();
  await cauldron.beginTransaction();

  if (copyFromVersion === 'none') {
    copyFromVersion = undefined;
  } else if (
    !copyFromVersion &&
    (await cauldron.isDescriptorInCauldron(
      new AppPlatformDescriptor(descriptor.name, descriptor.platform),
    ))
  ) {
    const mostRecentVersion = await cauldron.getMostRecentNativeApplicationVersion(
      descriptor,
    );
    if (
      mostRecentVersion &&
      (await askUserConfirmation(
        `Do you want to copy data from version (${mostRecentVersion.name}) ?`,
      ))
    ) {
      copyFromVersion = mostRecentVersion.name;
    }
  }

  config = config && (await parseJsonFromStringOrFile(config));

  await kax.task(`Adding ${descriptor}`).run(
    cauldron.addNativeApplicationVersion(descriptor, {
      config,
      copyFromVersion,
      description,
    }),
  );

  await kax
    .task('Updating Cauldron')
    .run(cauldron.commitTransaction(`Add ${descriptor} native application`));
  log.info(`${descriptor} successfully added to the the Cauldron`);
};

export const handler = tryCatchWrap(commandHandler);
