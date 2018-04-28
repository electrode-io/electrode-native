import { NativeApplicationDescriptor, utils as coreUtils } from 'ern-core'
import {
  performCodePushPatch,
  askUserForCodePushDeploymentName,
} from '../../lib/publication'
import utils from '../../lib/utils'
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
    .epilog(utils.epilog(exports))
}

export const handler = async ({
  descriptor,
  deploymentName,
  label,
  disabled,
  mandatory,
  rollout,
}: {
  descriptor?: string
  deploymentName?: string
  label?: string
  disabled?: boolean
  mandatory?: boolean
  rollout?: number
}) => {
  try {
    if (!descriptor) {
      descriptor = await utils.askUserToChooseANapDescriptorFromCauldron({
        onlyReleasedVersions: true,
      })
    }

    const napDescriptor = NativeApplicationDescriptor.fromString(descriptor)

    await utils.logErrorAndExitIfNotSatisfied({
      isCompleteNapDescriptorString: { descriptor },
      napDescriptorExistInCauldron: {
        descriptor,
        extraErrorMessage:
          'You cannot CodePush to a non existing native application version.',
      },
    })

    if (!deploymentName) {
      deploymentName = await askUserForCodePushDeploymentName(napDescriptor)
    }

    if (!label) {
      const { userInputedLabel } = await inquirer.prompt(<inquirer.Question>{
        message:
          'Please enter a label name corresponding to the release entry to patch',
        name: 'userSelectedDeploymentName',
        type: 'input',
      })

      label = userInputedLabel
    }

    await performCodePushPatch(napDescriptor, deploymentName, label, {
      isDisabled: disabled,
      isMandatory: mandatory,
      rollout,
    })
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}
