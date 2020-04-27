import {
  AppVersionDescriptor,
  log,
  PackagePath,
  utils as coreUtils,
} from 'ern-core';
import { getActiveCauldron } from 'ern-cauldron-api';
import { performCodePushOtaUpdate } from 'ern-orchestrator';
import {
  askUserConfirmation,
  askUserForCodePushDeploymentName,
  askUserToChooseOneOrMoreNapDescriptorFromCauldron,
  epilog,
  logErrorAndExitIfNotSatisfied,
  tryCatchWrap,
} from '../../lib';
import _ from 'lodash';
import { Argv } from 'yargs';

export const command = 'release';
export const desc =
  'CodePush MiniApp(s) or JS API implementation(s) version(s) to a target native application version';

export const builder = (argv: Argv) => {
  return argv
    .option('baseComposite', {
      describe: 'Base Composite',
      type: 'string',
    })
    .coerce('baseComposite', (d) => PackagePath.fromString(d))
    .option('deploymentName', {
      describe: 'Deployment to release the update to',
      type: 'string',
    })
    .option('description', {
      alias: 'des',
      describe: 'Description of the changes made to the app with this release',
      type: 'string',
    })
    .option('descriptors', {
      alias: 'd',
      describe:
        'Full native application descriptors (target native application versions for the push)',
      type: 'array',
    })
    .coerce('descriptors', (d) =>
      d.map((t: string) => AppVersionDescriptor.fromString(t)),
    )
    .option('force', {
      alias: 'f',
      describe:
        'Force upgrade (ignore compatibility issues -at your own risks-)',
      type: 'boolean',
    })
    .option('disableDuplicateReleaseError', {
      default: false,
      describe:
        'When this flag is set, releasing a package that is identical to the latest release will produce a warning instead of an error',
      type: 'boolean',
    })
    .option('jsApiImpls', {
      describe: 'One or more JS API implementation to CodePush',
      type: 'array',
    })
    .option('mandatory', {
      alias: 'm',
      default: false,
      describe: 'Specifies whether this release should be considered mandatory',
      type: 'boolean',
    })
    .option('miniapps', {
      describe: 'One or more MiniApp to CodePush',
      type: 'array',
    })
    .option('rollout', {
      alias: 'r',
      default: 100,
      describe:
        'Percentage of users this release should be immediately available to',
      type: 'number',
    })
    .option('semVerDescriptor', {
      describe:
        'A native application descriptor using a semver expression for the version',
    })
    .option('skipConfirmation', {
      alias: 's',
      describe: 'Skip confirmation prompts',
      type: 'boolean',
    })
    .option('sourceMapOutput', {
      describe: 'Path to source map file to generate for this codepush',
      type: 'string',
    })
    .option('targetBinaryVersion', {
      alias: 't',
      describe:
        'Semver expression that specifies the binary app version(s) this release is targeting',
      type: 'string',
    })
    .epilog(epilog(exports));
};

export const commandHandler = async ({
  baseComposite,
  deploymentName,
  description,
  descriptors = [],
  disableDuplicateReleaseError,
  force,
  jsApiImpls = [],
  mandatory,
  miniapps = [],
  rollout,
  skipConfirmation,
  semVerDescriptor,
  sourceMapOutput,
  targetBinaryVersion,
}: {
  baseComposite?: PackagePath;
  deploymentName: string;
  description: string;
  descriptors?: AppVersionDescriptor[];
  disableDuplicateReleaseError: boolean;
  force: boolean;
  jsApiImpls: string[];
  mandatory?: boolean;
  miniapps: string[];
  rollout?: number;
  skipConfirmation?: boolean;
  semVerDescriptor?: string;
  sourceMapOutput?: string;
  targetBinaryVersion?: string;
}) => {
  if (miniapps.length === 0 && jsApiImpls.length === 0) {
    throw new Error(
      'You need to provide at least one MiniApp or one JS API implementation version to CodePush',
    );
  }

  await logErrorAndExitIfNotSatisfied({
    checkIfCodePushOptionsAreValid: {
      descriptors,
      semVerDescriptor,
      targetBinaryVersion,
    },
  });

  if (descriptors.length > 0) {
    // User provided one or more descriptor(s)
    await logErrorAndExitIfNotSatisfied({
      napDescriptorExistInCauldron: {
        descriptor: descriptors,
        extraErrorMessage:
          'You cannot CodePush to a non existing native application version.',
      },
      sameNativeApplicationAndPlatform: {
        descriptors,
        extraErrorMessage:
          'You can only pass descriptors that match the same native application and version',
      },
    });
  } else if (descriptors.length === 0 && !semVerDescriptor) {
    // User provided no descriptors, nor a semver descriptor
    descriptors = await askUserToChooseOneOrMoreNapDescriptorFromCauldron({
      onlyReleasedVersions: true,
    });
  } else if (semVerDescriptor) {
    // User provided a semver Descriptor
    const semVerNapDescriptor = AppVersionDescriptor.fromString(
      semVerDescriptor,
    );
    const cauldron = await getActiveCauldron();
    descriptors = await cauldron.getDescriptorsMatchingSemVerDescriptor(
      semVerNapDescriptor,
    );
    if (descriptors.length === 0) {
      throw new Error(`No versions matching ${semVerDescriptor} were found`);
    } else {
      log.info(
        'CodePush release will target the following native application descriptors :',
      );
      for (const descriptor of descriptors) {
        log.info(`- ${descriptor}`);
      }
      if (!skipConfirmation) {
        const userConfirmedVersions = await askUserConfirmation(
          'Do you want to proceed ?',
        );
        if (!userConfirmedVersions) {
          throw new Error('Aborting command execution');
        }
      }
    }
  }

  await logErrorAndExitIfNotSatisfied({
    noFileSystemPath: {
      extraErrorMessage:
        'You cannot provide dependencies using git or file scheme for this command. Only the form miniapp@version is allowed.',
      obj: [...miniapps, ...jsApiImpls],
    },
  });

  const miniAppsPackages = _.map(miniapps, PackagePath.fromString);
  const jsApiImplsPackages = _.map(jsApiImpls, PackagePath.fromString);
  const packages = [...miniAppsPackages, ...jsApiImplsPackages];
  for (const pkg of packages) {
    if (pkg.isGitPath && (await coreUtils.isGitBranch(pkg))) {
      throw new Error(
        'You cannot code push packages from a git branch. Only SHA or TAGs are supported.',
      );
    }
  }

  if (!deploymentName) {
    deploymentName = await askUserForCodePushDeploymentName(descriptors[0]);
  }

  for (const descriptor of descriptors) {
    const pathToYarnLock = await getPathToYarnLock(descriptor, deploymentName);
    await performCodePushOtaUpdate(
      descriptor,
      deploymentName,
      miniAppsPackages,
      jsApiImplsPackages,
      {
        baseComposite,
        codePushIsMandatoryRelease: mandatory,
        codePushRolloutPercentage: rollout,
        description,
        disableDuplicateReleaseError,
        force,
        pathToYarnLock: pathToYarnLock || undefined,
        sourceMapOutput,
        targetBinaryVersion,
      },
    );
  }
  log.info(`Successfully released`);
};

async function getPathToYarnLock(
  napDescriptor: AppVersionDescriptor,
  deploymentName: string,
) {
  const cauldron = await getActiveCauldron();
  if (!cauldron) {
    throw new Error('[getPathToYarnLock] No active Cauldron');
  }
  let pathToYarnLock = await cauldron.getPathToYarnLock(
    napDescriptor,
    deploymentName,
  );
  if (!pathToYarnLock) {
    pathToYarnLock = await cauldron.getPathToYarnLock(
      napDescriptor,
      'container',
    );
  }
  return pathToYarnLock;
}

export const handler = tryCatchWrap(commandHandler);
