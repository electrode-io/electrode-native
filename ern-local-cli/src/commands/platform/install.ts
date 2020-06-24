import { Platform } from 'ern-core';
import { epilog, tryCatchWrap } from '../../lib';
import { Argv } from 'yargs';

export const command = 'install <version>';
export const desc = 'Install a given ern platform version';

export const builder = (argv: Argv) => {
  return argv.epilog(epilog(exports));
};

export const commandHandler = async ({ version }: { version: string }) => {
  Platform.installPlatform(version.toString());
};

export const handler = tryCatchWrap(commandHandler);
