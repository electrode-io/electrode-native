import { MiniApp } from 'ern-core';
import { epilog, logErrorAndExitIfNotSatisfied, tryCatchWrap } from '../lib';
import { Argv } from 'yargs';

export const command = 'upgrade-miniapp';
export const desc = 'Upgrade a MiniApp to current or specific platform version';

export const builder = (argv: Argv) => {
  return argv
    .option('version', {
      alias: 'v',
      describe: 'Specific platform version to upgrade MiniApp to',
      type: 'string',
    })
    .option('manifestId', {
      describe:
        'Id of the manifest entry to use to retrieve versions to upgrade to',
      type: 'string',
    })
    .epilog(epilog(exports));
};

export const commandHandler = async ({
  manifestId,
  version,
}: {
  manifestId?: string;
  version?: string;
}) => {
  if (manifestId) {
    await logErrorAndExitIfNotSatisfied({
      manifestIdExists: {
        id: manifestId,
      },
    });
  }

  const miniApp = MiniApp.fromCurrentPath();
  const versionWithoutPrefix = version && version.toString().replace('v', '');
  await miniApp.upgrade({ manifestId, platformVersion: versionWithoutPrefix });
};

export const handler = tryCatchWrap(commandHandler);
