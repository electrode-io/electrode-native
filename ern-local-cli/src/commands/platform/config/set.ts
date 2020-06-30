import { config as ernConfig, log } from 'ern-core';
import {
  epilog,
  logErrorAndExitIfNotSatisfied,
  platformSupportedConfigAsString,
  tryCatchWrap,
} from '../../../lib';
import { Argv } from 'yargs';

export const command = 'set <key> <value>';
export const desc = 'Sets the key to the value in the configuration file';

export const builder = (argv: Argv) => {
  return argv.epilog(platformSupportedConfigAsString() + epilog(exports));
};

export const commandHandler = async ({
  key,
  value,
}: {
  key: string;
  value: string;
}) => {
  await logErrorAndExitIfNotSatisfied({
    isValidPlatformConfig: {
      key,
    },
  });

  let valueToset: any = value;
  if (!isNaN(+value!)) {
    valueToset = +value!;
  } else {
    try {
      valueToset = JSON.parse(valueToset);
    } catch (e) {
      // swallow
    }
  }
  ernConfig.set(key, valueToset);
  log.info(`Successfully set ${key} value to ${ernConfig.get(key)}`);
};

export const handler = tryCatchWrap(commandHandler);
