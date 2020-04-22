import {
  kax,
  log,
  MiniApp,
  ModuleTypes,
  utils as coreUtils,
  validateModuleName,
} from 'ern-core';
import {
  askUserToInputPackageName,
  epilog,
  logErrorAndExitIfNotSatisfied,
  performPkgNameConflictCheck,
  promptUserToUseSuggestedModuleName,
  tryCatchWrap,
} from '../lib';
import chalk from 'chalk';
import { Argv } from 'yargs';

export const command = 'create-miniapp <appName>';
export const desc = 'Create a new ern application(miniapp)';

export const builder = (argv: Argv) => {
  return argv
    .option('language', {
      choices: ['JavaScript', 'TypeScript', undefined],
      deprecated: 'use --template directly',
      describe: 'Language to use for this MiniApp',
      type: 'string',
    })
    .option('packageName', {
      alias: 'p',
      describe: 'Name to use for the MiniApp npm package',
    })
    .option('platformVersion', {
      alias: 'v',
      describe:
        'Overrides current platform version in use with this platform version',
      type: 'string',
    })
    .option('manifestId', {
      describe: 'Id of the Manifest entry to use to create this MiniApp',
      type: 'string',
    })
    .option('npm', {
      describe: 'Use npm instead of Yarn to install dependencies',
      type: 'boolean',
    })
    .option('scope', {
      alias: 's',
      describe: 'Scope to use for the MiniApp npm package',
    })
    .option('skipInstall', {
      describe: 'Skip the installation of dependencies after project creation',
      type: 'boolean',
    })
    .option('skipNpmCheck', {
      describe:
        'Skip the check ensuring package does not already exists in npm registry',
      type: 'boolean',
    })
    .option('packageManager', {
      choices: ['npm', 'yarn', undefined],
      deprecated: 'Yarn is the default, use --npm to override',
      describe: 'Package manager to use for this MiniApp',
      type: 'string',
    })
    .option('template', {
      describe: 'Template to use to create the MiniApp',
      type: 'string',
    })
    .epilog(epilog(exports));
};

export const commandHandler = async ({
  appName,
  language,
  manifestId,
  npm,
  packageManager,
  packageName,
  platformVersion,
  scope,
  skipInstall,
  skipNpmCheck,
  template,
}: {
  appName: string;
  language: 'JavaScript' | 'TypeScript';
  manifestId?: string;
  npm?: boolean;
  packageName?: string;
  packageManager?: 'npm' | 'yarn';
  platformVersion: string;
  scope?: string;
  skipInstall?: boolean;
  skipNpmCheck?: boolean;
  template?: string;
}) => {
  await logErrorAndExitIfNotSatisfied({
    isValidElectrodeNativeModuleName: {
      name: appName,
    },
  });

  if (language) {
    log.warn('Deprecated: --language. Use --template, or omit to use default.');
  }

  if (packageManager === 'yarn') {
    log.warn('Deprecated: --packageManager. Yarn is the default.');
  } else if (packageManager === 'npm') {
    log.warn(
      'Deprecated: --packageManager. Use --npm to override default usage of Yarn.',
    );
  }

  if (manifestId) {
    await logErrorAndExitIfNotSatisfied({
      manifestIdExists: {
        id: manifestId,
      },
    });
  }

  if (!validateModuleName(appName, ModuleTypes.MINIAPP)) {
    appName = await promptUserToUseSuggestedModuleName(
      appName,
      ModuleTypes.MINIAPP,
    );
  }

  if (!packageName) {
    const defaultPackageName = coreUtils.getDefaultPackageNameForModule(
      appName,
      ModuleTypes.MINIAPP,
    );
    packageName = await askUserToInputPackageName({ defaultPackageName });
  }

  if (packageManager === 'npm' || npm) {
    packageManager = 'npm';
  } else {
    packageManager = 'yarn';
  }

  await logErrorAndExitIfNotSatisfied({
    isValidNpmPackageName: {
      name: packageName,
    },
  });

  if (!skipNpmCheck && !(await performPkgNameConflictCheck(packageName))) {
    throw new Error(`Aborting command `);
  }

  await kax.task('Creating MiniApp').run(
    MiniApp.create(appName, packageName, {
      language,
      manifestId,
      packageManager,
      platformVersion: platformVersion && platformVersion.replace('v', ''),
      scope,
      skipInstall,
      template,
    }),
  );

  log.info(`${appName} MiniApp was successfully created !`);
  log.info(`================================================`);
  log.info(chalk.bold.white('To run your MiniApp on Android :'));
  log.info(chalk.white(`    > cd ${appName}`));
  log.info(chalk.white(`followed by :`));
  log.info(chalk.white(`    > ern run-android`));
  log.info(chalk.bold.white('To run your MiniApp on iOS :'));
  log.info(chalk.white(`    > cd ${appName}`));
  log.info(chalk.white(`followed by :`));
  log.info(chalk.white(`    > ern run-ios`));
  log.info(`================================================`);
};

export const handler = tryCatchWrap(commandHandler);
