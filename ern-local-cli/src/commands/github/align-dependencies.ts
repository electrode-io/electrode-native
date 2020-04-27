import { getActiveCauldron } from 'ern-cauldron-api';
import { AppVersionDescriptor, PackagePath } from 'ern-core';
import { alignPackageJsonOnManifest } from 'ern-orchestrator';
import {
  askUserToChooseANapDescriptorFromCauldron,
  epilog,
  logErrorAndExitIfNotSatisfied,
  tryCatchWrap,
} from '../../lib';
import { Argv } from 'yargs';

export const command = 'align-dependencies';
export const desc =
  'Align dependencies of all GitHub based packages on a manifest id';

export const builder = (argv: Argv) => {
  return argv
    .option('descriptor', {
      describe: 'Native application version containing the packages to upgrade',
      type: 'string',
    })
    .coerce('descriptor', d => AppVersionDescriptor.fromString(d))
    .option('jsApiImplsOnly', {
      describe: 'Only update package.json of JS API Implementations',
      type: 'boolean',
    })
    .option('manifestId', {
      default: 'default',
      describe:
        'Id of the manifest entry to use to retrieve versions to upgrade to',
      type: 'string',
    })
    .option('miniAppsOnly', {
      describe: 'Only update package.json of MiniApps',
      type: 'boolean',
    })
    .epilog(epilog(exports));
};

export const commandHandler = async ({
  descriptor,
  jsApiImplsOnly,
  manifestId = 'default',
  miniAppsOnly,
}: {
  descriptor?: AppVersionDescriptor;
  jsApiImplsOnly?: boolean;
  manifestId?: string;
  miniAppsOnly?: boolean;
} = {}) => {
  descriptor =
    descriptor ||
    (await askUserToChooseANapDescriptorFromCauldron({
      onlyNonReleasedVersions: true,
    }));

  await logErrorAndExitIfNotSatisfied({
    isEnvVariableDefined: {
      extraErrorMessage:
        'ERN_GITHUB_TOKEN environment variable must be set, to use `ern github` commands',
      name: 'ERN_GITHUB_TOKEN',
    },
    manifestIdExists: {
      id: manifestId,
    },
    napDescriptorExistInCauldron: {
      descriptor,
      extraErrorMessage:
        'This command cannot work on a non existing native application version',
    },
  });

  const cauldron = await getActiveCauldron();

  const packages: PackagePath[] = await cauldron.getContainerJsPackages({
    descriptor,
    jsApiImplsOnly,
    miniAppsOnly,
    type: 'branches',
  });

  await alignPackageJsonOnManifest({ manifestId, packages });
};

export const handler = tryCatchWrap(commandHandler);
