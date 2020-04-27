import { AppVersionDescriptor, kax, log } from 'ern-core';
import { getBinaryStoreFromCauldron } from 'ern-orchestrator';
import { epilog, logErrorAndExitIfNotSatisfied, tryCatchWrap } from '../../lib';
import { Argv } from 'yargs';

export const command = 'remove <descriptor>';
export const desc = 'Remove a mobile application binary from the binary store';

export const builder = (argv: Argv) => {
  return argv
    .coerce('descriptor', d => AppVersionDescriptor.fromString(d))
    .option('flavor', {
      describe: 'Custom flavor of this binary',
      type: 'string',
    })
    .epilog(epilog(exports));
};

export const commandHandler = async ({
  descriptor,
  flavor,
}: {
  descriptor: AppVersionDescriptor;
  flavor?: string;
}) => {
  await logErrorAndExitIfNotSatisfied({
    napDescriptorExistInCauldron: { descriptor },
  });

  const binaryStore = await getBinaryStoreFromCauldron();
  await kax
    .task('Removing binary from store')
    .run(binaryStore.removeBinary(descriptor, { flavor }));
  log.info(
    `${descriptor} binary ${
      flavor ? `[flavor: ${flavor}]` : ''
    } was successfuly removed from the store`,
  );
};

export const handler = tryCatchWrap(commandHandler);
