import { Argv } from 'yargs';
import {
  epilog,
  logErrorAndExitIfNotSatisfied,
  tryCatchWrap,
} from '../../../lib';
import { config as ernConfig, log } from 'ern-core';

export const command = 'get <key>';
export const desc = 'Echo the config value to stdout';

export const builder = (argv: Argv) => {
  return argv.epilog(epilog(exports));
};

export const commandHandler = async ({ key }: { key: string }) => {
  await logErrorAndExitIfNotSatisfied({
    isValidPlatformConfig: {
      key,
    },
  });
  if (ernConfig.get(key)) {
    log.info(`Configuration value for ${key} is ${ernConfig.get(key)}`);
  } else {
    log.warn(`${key} was not found in config`);
  }
};

export const handler = tryCatchWrap(commandHandler);
