import { Platform } from 'ern-core';
import { epilog, tryCatchWrap } from '../../lib';
import { Argv } from 'yargs';

export const command = 'use <version>';
export const desc = 'Switch to a given ern platform version';

export const builder = (argv: Argv) => {
  return argv.epilog(epilog(exports));
};

export const commandHandler = async ({ version }: { version: string }) => {
  Platform.switchToVersion(version.toString());
};

export const handler = tryCatchWrap(commandHandler);
