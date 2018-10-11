import { NativeApplicationDescriptor, utils as coreUtils } from 'ern-core'
import { performCodePushPatch } from 'ern-orchestrator'
import {
  epilog,
  logErrorAndExitIfNotSatisfied,
  askUserForCodePushDeploymentName,
  askUserToChooseANapDescriptorFromCauldron,
} from '../../lib'
import inquirer from 'inquirer'
import { Argv } from 'yargs'

export const command = 'patch'
export const desc = 'Patch a CodePush release'

export const builder = (argv: Argv) => {
  return argv
    .option('descriptor', {
      describe:
        'Full native application descriptor from which to promote a release',
      type: 'string',
    })
    .coerce('descriptor', d =>
      NativeApplicationDescriptor.fromString(d, { throwIfNotComplete: true })
    )
    .option('deploymentName', {
      describe: 'Deployment to release the update to',
      type: 'string',
    })
    .option('label', {
      alias: 'l',
      describe: 'Label of the release to update',
      type: 'string',
    })
    .option('disabled', {
      alias: 'x',
      describe:
        'Specifies whether this release should be immediately downloadable',
      type: 'boolean',
    })
    .option('mandatory', {
      alias: 'm',
      default: false,
      describe: 'Specifies whether this release should be considered mandatory',
      type: 'boolean',
    })
    .option('rollout', {
      alias: 'r',
      describe:
        'Percentage of users this release should be immediately available to',
      type: 'number',
    })
    .epilog(epilog(exports))
}

export const handler = async ({
  descriptor,
  deploymentName,
  label,
  disabled,
  mandatory,
  rollout,
}: {
  descriptor?: NativeApplicationDescriptor
  deploymentName?: string
  label?: string
  disabled?: boolean
  mandatory?: boolean
  rollout?: number
}) => {
  try {
    await logErrorAndExitIfNotSatisfied({
      cauldronIsActive: {
        extraErrorMessage:
          'A Cauldron must be active in order to use this command',
      },
    })

    descriptor =
      descriptor ||
      (await askUserToChooseANapDescriptorFromCauldron({
        onlyReleasedVersions: true,
      }))

    await logErrorAndExitIfNotSatisfied({
      napDescriptorExistInCauldron: {
        descriptor,
        extraErrorMessage:
          'You cannot CodePush to a non existing native application version.',
      },
    })

    if (!deploymentName) {
      deploymentName = await askUserForCodePushDeploymentName(descriptor)
    }

    if (!label) {
      const { userInputedLabel } = await inquirer.prompt(<inquirer.Question>{
        message:
          'Please enter a label name corresponding to the release entry to patch',
        name: 'userSelectedDeploymentName',
        type: 'input',
      })

      label = <string>userInputedLabel
    }

    await performCodePushPatch(descriptor, deploymentName, label, {
      isDisabled: disabled,
      isMandatory: mandatory,
      rollout,
    })
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}
