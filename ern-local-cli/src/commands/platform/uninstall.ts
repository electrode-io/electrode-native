import { Argv } from 'yargs';
import { Platform } from 'ern-core';
import { epilog, tryCatchWrap } from '../../lib';

export const command = 'uninstall <version>';
export const desc = 'Uninstall a given platform version';

export const builder = (argv: Argv) => {
  return argv.epilog(epilog(exports));
};

export const commandHandler = async ({ version }: { version: string }) => {
  Platform.uninstallPlatform(version.toString().replace('v', ''));
};

export const handler = tryCatchWrap(commandHandler);
