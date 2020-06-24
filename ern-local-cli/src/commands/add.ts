import { log, MiniApp, PackagePath } from 'ern-core';
import { epilog, logErrorAndExitIfNotSatisfied, tryCatchWrap } from '../lib';
import { Argv } from 'yargs';

// Note : We use `pkg` instead of `package` because `package` is
// a reserved JavaScript word
export const command = 'add <packages..>';
export const desc = 'Add one or more package(s) to this miniapp';

export const builder = (argv: Argv) => {
  return argv
    .option('dev', {
      alias: 'd',
      default: false,
      describe: 'Add this/these packages to devDependencies',
      type: 'boolean',
    })
    .option('peer', {
      alias: 'p',
      default: false,
      describe: 'Add this/these packages to peerDependencies',
      type: 'boolean',
    })
    .option('manifestId', {
      describe: 'Id of the Manifest entry to use to create this MiniApp',
      type: 'string',
    })
    .epilog(epilog(exports));
};

export const commandHandler = async ({
  dev,
  manifestId,
  packages,
  peer,
}: {
  dev: boolean;
  manifestId?: string;
  packages: string[];
  peer: boolean;
}) => {
  if (manifestId) {
    await logErrorAndExitIfNotSatisfied({
      manifestIdExists: {
        id: manifestId,
      },
    });
  }

  for (const pkg of packages) {
    log.debug(`Adding package: ${pkg}`);
    await MiniApp.fromCurrentPath().addDependency(PackagePath.fromString(pkg), {
      dev,
      manifestId,
      peer,
    });
    log.info(`Successfully added ${pkg}`);
  }
};

export const handler = tryCatchWrap(commandHandler);
