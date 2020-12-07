import { Argv } from 'yargs';
import { epilog, tryCatchWrap } from '../../../lib';
import { getActiveCauldron } from 'ern-cauldron-api';
import { AnyAppDescriptor } from 'ern-core';

export const command = 'get';
export const desc = 'Echoes configuration stored in Cauldron';

export const builder = (argv: Argv) => {
  return argv
    .option('descriptor', {
      describe:
        'Partial or full native application descriptor for which to get the config from (top level config if not specified)',
      type: 'string',
    })
    .coerce('descriptor', (d: string) => d.toAppDescriptor())
    .option('json', {
      describe: 'Output config as a single line JSON record',
      type: 'boolean',
    })
    .option('key', {
      describe:
        'The config key (echoes the whole config object if not specified)',
      type: 'string',
    })
    .option('strict', {
      default: false,
      describe: 'Echoes the config strictly associated to the descriptor',
      type: 'boolean',
    })
    .epilog(epilog(exports));
};

export const commandHandler = async ({
  descriptor,
  json,
  key,
  strict,
}: {
  descriptor?: AnyAppDescriptor;
  json?: boolean;
  key?: string;
  strict: boolean;
}) => {
  const cauldron = await getActiveCauldron({
    ignoreRequiredErnVersionMismatch: true,
    throwIfNoActiveCauldron: true,
  });
  let result: any;
  if (key && strict) {
    result = await cauldron.getConfigForKeyStrict(key, descriptor);
  } else if (key && !strict) {
    result = await cauldron.getConfigForKey(key, descriptor);
  } else if (!key && strict) {
    result = await cauldron.getConfigStrict(descriptor);
  } else if (!key && !strict) {
    result = await cauldron.getConfig(descriptor);
  }

  process.stdout.write(
    json ? JSON.stringify(result) : JSON.stringify(result, null, 2),
  );
};

export const handler = tryCatchWrap(commandHandler);
