import { AppVersionDescriptor, log } from 'ern-core';
import { getActiveCauldron } from 'ern-cauldron-api';
import { performCodePushPromote } from 'ern-orchestrator';
import {
  askUserConfirmation,
  askUserForCodePushDeploymentName,
  askUserToChooseANapDescriptorFromCauldron,
  askUserToChooseOneOrMoreNapDescriptorFromCauldron,
  epilog,
  logErrorAndExitIfNotSatisfied,
  tryCatchWrap,
} from '../../lib';
import { Argv } from 'yargs';

export const command = 'promote';
export const desc =
  'Promote a CodePush release to a different deployment environment';

export const builder = (argv: Argv) => {
  return argv
    .option('description', {
      alias: 'des',
      describe:
        'Description of the changes made to the app with this release. If omitted, the description from the release being promoted will be used.',
      type: 'string',
    })
    .option('disableDuplicateReleaseError', {
      default: false,
      describe:
        'When this flag is set, promoting a package that is identical to the latest release on the target deployment will produce a warning instead of an error',
      type: 'boolean',
    })
    .option('force', {
      alias: 'f',
      describe:
        'Force upgrade (ignore compatibility issues -at your own risks-)',
      type: 'boolean',
    })
    .option('label', {
      alias: 'l',
      describe:
        'Promote the release matching this label. If omitted, the latest release of sourceDescriptor/sourceDeploymentName pair will be promoted.',
      type: 'string',
    })
    .option('mandatory', {
      alias: 'm',
      default: false,
      describe: 'Specifies whether this release should be considered mandatory',
      type: 'boolean',
    })
    .option('reuseReleaseBinaryVersion', {
      describe:
        'Indicates whether to reuse the target binary version that was used for the initial release',
      type: 'boolean',
    })
    .option('rollout', {
      alias: 'r',
      default: 100,
      describe:
        'Percentage of users this release should be immediately available to',
      type: 'number',
    })
    .option('skipConfirmation', {
      alias: 's',
      describe: 'Skip confirmation prompts',
      type: 'boolean',
    })
    .option('skipNativeDependenciesVersionAlignedCheck', {
      alias: 'n',
      describe:
        'Skip the check to compare native dependencies version alignment',
      type: 'boolean',
    })
    .option('sourceDeploymentName', {
      describe:
        'Name of the deployment environment to promote the release from',
      type: 'string',
    })
    .option('sourceDescriptor', {
      describe:
        'Full native application descriptor from which to promote a release',
      type: 'string',
    })
    .coerce('sourceDescriptor', (d) => AppVersionDescriptor.fromString(d))
    .option('targetBinaryVersion', {
      alias: 't',
      describe:
        'Semver expression that specifies the binary app version(s) this release is targeting',
      type: 'string',
    })
    .option('targetDeploymentName', {
      describe: 'Name of the deployment environment to promote the release to',
      type: 'string',
    })
    .option('targetDescriptors', {
      describe:
        'One or more native application descriptors matching targeted versions',
      type: 'array',
    })
    .coerce('targetDescriptors', (d) =>
      d.map((t: string) => AppVersionDescriptor.fromString(t)),
    )
    .option('targetSemVerDescriptor', {
      describe:
        'A target native application descriptor using a semver expression for the version',
    })
    .epilog(epilog(exports));
};

export const commandHandler = async ({
  description,
  disableDuplicateReleaseError,
  force,
  label,
  mandatory,
  reuseReleaseBinaryVersion,
  sourceDeploymentName,
  targetBinaryVersion,
  targetDeploymentName,
  sourceDescriptor,
  targetDescriptors = [],
  targetSemVerDescriptor,
  rollout,
  skipConfirmation,
  skipNativeDependenciesVersionAlignedCheck,
}: {
  description?: string;
  disableDuplicateReleaseError?: boolean;
  force?: boolean;
  label?: string;
  mandatory?: boolean;
  reuseReleaseBinaryVersion?: boolean;
  sourceDeploymentName?: string;
  targetBinaryVersion?: string;
  targetDeploymentName?: string;
  sourceDescriptor?: AppVersionDescriptor;
  targetDescriptors?: AppVersionDescriptor[];
  targetSemVerDescriptor?: string;
  rollout?: number;
  skipConfirmation?: boolean;
  skipNativeDependenciesVersionAlignedCheck?: boolean;
}) => {
  await logErrorAndExitIfNotSatisfied({
    checkIfCodePushOptionsAreValid: {
      descriptors: targetDescriptors,
      semVerDescriptor: targetSemVerDescriptor,
      targetBinaryVersion,
    },
  });

  if (reuseReleaseBinaryVersion && targetBinaryVersion) {
    throw new Error(
      `reuseReleaseBinaryVersion and targetBinaryVersion options are mutually exclusive`,
    );
  }

  sourceDescriptor =
    sourceDescriptor ||
    (await askUserToChooseANapDescriptorFromCauldron({
      message: 'Please select a source native application descriptor',
      onlyReleasedVersions: true,
    }));

  if (targetDescriptors.length > 0) {
    // User provided one or more target descriptor(s)
    await logErrorAndExitIfNotSatisfied({
      napDescriptorExistInCauldron: {
        descriptor: targetDescriptors,
        extraErrorMessage:
          'You cannot CodePush to a non existing native application version.',
      },
    });
  } else if (targetDescriptors.length === 0 && !targetSemVerDescriptor) {
    // User provided no target descriptors, nor a target semver descriptor
    targetDescriptors = await askUserToChooseOneOrMoreNapDescriptorFromCauldron(
      {
        message:
          'Please select one or more target native application descriptor(s)',
        onlyReleasedVersions: true,
      },
    );
  } else if (targetSemVerDescriptor) {
    // User provided a target semver descriptor
    const targetSemVerNapDescriptor = AppVersionDescriptor.fromString(
      targetSemVerDescriptor,
    );
    const cauldron = await getActiveCauldron();
    targetDescriptors = await cauldron.getDescriptorsMatchingSemVerDescriptor(
      targetSemVerNapDescriptor,
    );
    if (targetDescriptors.length === 0) {
      throw new Error(
        `No versions matching ${targetSemVerDescriptor} were found`,
      );
    } else {
      log.info(
        'CodePush promotion will target the following native application descriptors :',
      );
      for (const targetDescriptor of targetDescriptors) {
        log.info(`- ${targetDescriptor}`);
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
    sameNativeApplicationAndPlatform: {
      descriptors: targetDescriptors,
      extraErrorMessage:
        'You can only pass descriptors that match the same native application and version',
    },
  });

  if (!sourceDeploymentName) {
    sourceDeploymentName = await askUserForCodePushDeploymentName(
      sourceDescriptor,
      'Please select a source deployment environment',
    );
  }

  if (!targetDeploymentName) {
    targetDeploymentName = await askUserForCodePushDeploymentName(
      sourceDescriptor,
      'Please select a target deployment environment',
    );
  }

  await performCodePushPromote(
    sourceDescriptor,
    targetDescriptors,
    sourceDeploymentName,
    targetDeploymentName,
    {
      description,
      disableDuplicateReleaseError,
      force,
      label,
      mandatory,
      reuseReleaseBinaryVersion,
      rollout,
      skipNativeDependenciesVersionAlignedCheck,
      targetBinaryVersion,
    },
  );
  log.info(`Successfully promoted ${sourceDescriptor}`);
};

export const handler = tryCatchWrap(commandHandler);
