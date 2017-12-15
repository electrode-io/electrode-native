// @flow

import {
  NativeApplicationDescriptor,
  Utils
} from 'ern-util'
import {
  performCodePushPatch,
  askUserForCodePushDeploymentName
} from '../../lib/publication'
import utils from '../../lib/utils'
import inquirer from 'inquirer'

exports.command = 'patch'
exports.desc = 'Patch a CodePush release'

exports.builder = function (yargs: any) {
  return yargs
    .option('descriptor', {
      type: 'string',
      describe: 'Full native application descriptor from which to promote a release'
    })
    .option('deploymentName', {
      describe: 'Deployment to release the update to',
      type: 'string'
    })
    .option('label', {
      type: 'string',
      alias: 'l',
      describe: 'Label of the release to update'
    })
    .option('disabled', {
      type: 'boolean',
      alias: 'x',
      describe: 'Specifies whether this release should be immediately downloadable'
    })
    .option('mandatory', {
      type: 'bool',
      alias: 'm',
      describe: 'Specifies whether this release should be considered mandatory',
      default: false
    })
    .option('rollout', {
      type: 'number',
      alias: 'r',
      describe: 'Percentage of users this release should be immediately available to'
    })
    .epilog(utils.epilog(exports))
}

exports.handler = async function ({
  descriptor,
  deploymentName,
  label,
  disabled,
  mandatory,
  rollout
} : {
  descriptor?: string,
  deploymentName?: string,
  label?: string,
  disabled?: boolean,
  mandatory?: boolean,
  rollout?: number
}) {
  try {
    if (!descriptor) {
      descriptor = await utils.askUserToChooseANapDescriptorFromCauldron({ onlyReleasedVersions: true })
    }

    const napDescriptor = NativeApplicationDescriptor.fromString(descriptor)

    await utils.logErrorAndExitIfNotSatisfied({
      isCompleteNapDescriptorString: { descriptor },
      napDescriptorExistInCauldron: {
        descriptor,
        extraErrorMessage: 'You cannot CodePush to a non existing native application version.'
      }
    })

    if (!deploymentName) {
      deploymentName = await askUserForCodePushDeploymentName(napDescriptor)
    }

    if (!label) {
      const { userInputedLabel } = await inquirer.prompt({
        type: 'input',
        name: 'userSelectedDeploymentName',
        message: 'Please enter a label name corresponding to the release entry to patch'
      })

      label = userInputedLabel
    }

    await performCodePushPatch(
      napDescriptor,
      deploymentName,
      label, {
        isDisabled: disabled,
        isMandatory: mandatory,
        rollout
      })
  } catch (e) {
    Utils.logErrorAndExitProcess(e)
  }
}
