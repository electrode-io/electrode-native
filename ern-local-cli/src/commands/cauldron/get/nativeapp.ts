import { AnyAppDescriptor, log } from 'ern-core';
import { getActiveCauldron } from 'ern-cauldron-api';
import { epilog, tryCatchWrap } from '../../../lib';
import { Argv } from 'yargs';

export const command = 'nativeapp [descriptor]';
export const desc = 'Get a native application from the cauldron';

export const builder = (argv: Argv) => {
  return argv
    .coerce('descriptor', (d: string) => d.toAppDescriptor())
    .option('json', {
      describe: 'Output result as a single line JSON record',
      type: 'boolean',
    })
    .epilog(epilog(exports));
};

export const commandHandler = async ({
  descriptor,
  json,
}: {
  descriptor?: AnyAppDescriptor;
  json?: boolean;
}) => {
  const cauldron = await getActiveCauldron();
  if (!descriptor) {
    const napDescriptors = await cauldron.getNapDescriptorStrings();
    json
      ? process.stdout.write(JSON.stringify(napDescriptors))
      : napDescriptors.forEach(n => log.info(n));
  } else {
    const nativeApp = await cauldron.getDescriptor(descriptor);
    process.stdout.write(
      json ? JSON.stringify(nativeApp) : JSON.stringify(nativeApp, null, 1),
    );
  }
};

export const handler = tryCatchWrap(commandHandler);
