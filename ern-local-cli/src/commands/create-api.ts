import fs from 'fs-extra';
import { ApiGen } from 'ern-api-gen';
import {
  log,
  manifest,
  ModuleTypes,
  PackagePath,
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
import { Argv } from 'yargs';

export const command = 'create-api <apiName>';
export const desc = 'Create a new api';

export const builder = (argv: Argv) => {
  return argv
    .option('apiAuthor', {
      alias: 'u',
      describe: 'Author of library',
    })
    .option('apiVersion', {
      alias: 'a',
      describe: 'Initial npm version',
    })
    .option('manifestId', {
      describe: 'Id of the manifest entry to use',
      type: 'string',
    })
    .option('packageName', {
      alias: 'p',
      describe: 'Name to use for the api npm package',
    })
    .option('schemaPath', {
      alias: 'm',
      describe: 'Path to pre-existing schema(swagger)',
    })
    .option('scope', {
      alias: 's',
      describe: 'Scope to use for the api npm package',
    })
    .option('skipNpmCheck', {
      describe:
        'Skip the check ensuring package does not already exists in npm registry',
      type: 'boolean',
    })
    .epilog(epilog(exports));
};

export const commandHandler = async ({
  apiAuthor,
  apiName,
  apiVersion,
  manifestId,
  packageName,
  schemaPath,
  scope,
  skipNpmCheck,
}: {
  apiAuthor?: string;
  apiName: string;
  apiVersion?: string;
  manifestId?: string;
  packageName: string;
  schemaPath?: string;
  scope?: string;
  skipNpmCheck?: boolean;
}) => {
  await logErrorAndExitIfNotSatisfied({
    isValidElectrodeNativeModuleName: {
      name: apiName,
    },
  });

  if (manifestId) {
    await logErrorAndExitIfNotSatisfied({
      manifestIdExists: {
        id: manifestId,
      },
    });
  }

  if (schemaPath && !(await fs.pathExists(schemaPath))) {
    throw new Error(`Cannot resolve path to ${schemaPath}`);
  }

  if (!validateModuleName(apiName, ModuleTypes.API)) {
    apiName = await promptUserToUseSuggestedModuleName(
      apiName,
      ModuleTypes.API,
    );
  }

  // Construct the package name
  if (!packageName) {
    const defaultPackageName = coreUtils.getDefaultPackageNameForModule(
      apiName,
      ModuleTypes.API,
    );
    packageName = await askUserToInputPackageName({ defaultPackageName });
  }

  await logErrorAndExitIfNotSatisfied({
    isValidNpmPackageName: {
      name: packageName,
    },
  });

  if (!skipNpmCheck && !(await performPkgNameConflictCheck(packageName))) {
    throw new Error('Aborting command');
  }

  const bridgeDep = await manifest.getNativeDependency(
    PackagePath.fromString('react-native-electrode-bridge'),
    { manifestId },
  );
  if (!bridgeDep) {
    throw new Error(
      'react-native-electrode-bridge not found in manifest. cannot infer version to use',
    );
  }

  const reactNative = await manifest.getNativeDependency(
    PackagePath.fromString('react-native'),
    { manifestId },
  );
  if (!reactNative) {
    throw new Error(
      'react-native not found in manifest. cannot infer version to use',
    );
  }

  log.info(`Generating ${apiName}`);

  await ApiGen.generateApi({
    apiAuthor,
    apiSchemaPath: schemaPath,
    apiVersion,
    bridgeVersion: `${bridgeDep.version || ''}`,
    name: apiName,
    npmScope: scope,
    packageName,
    reactNativeVersion: reactNative.version,
  });
  log.info('Success');
};

export const handler = tryCatchWrap(commandHandler);
