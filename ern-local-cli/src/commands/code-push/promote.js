// @flow

import {
  NativeApplicationDescriptor,
  Utils
} from 'ern-util'
import {
  performCodePushPromote,
  askUserForCodePushDeploymentName
} from '../../lib/publication'
import utils from '../../lib/utils'
import _ from 'lodash'

exports.command = 'promote'
exports.desc = 'Promote a CodePush release to a different deployment environment'

exports.builder = function (yargs: any) {
  return yargs
    .option('sourceDescriptor', {
      type: 'string',
      describe: 'Full native application descriptor from which to promote a release'
    })
    .option('targetDescriptors', {
      type: 'array',
      describe: 'One or more native application descriptors matching targeted versions'
    })
    .option('sourceDeploymentName', {
      type: 'string',
      describe: 'Name of the deployment environment to promote the release from'
    })
    .option('targetDeploymentName', {
      type: 'string',
      describe: 'Name of the deployment environment to promote the release to'
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
      describe: 'Percentage of users this release should be immediately available to',
      default: 100
    })
    .epilog(utils.epilog(exports))
}

exports.handler = async function ({
  sourceDescriptor,
  targetDescriptors = [],
  sourceDeploymentName,
  targetDeploymentName,
  platform,
  mandatory,
  rollout
} : {
  sourceDescriptor?: string,
  targetDescriptors?: Array<string>,
  sourceDeploymentName?: string,
  targetDeploymentName?: string,
  platform: 'android' | 'ios',
  mandatory?: boolean,
  rollout?: number
}) {
  if (!sourceDescriptor) {
    sourceDescriptor = await utils.askUserToChooseANapDescriptorFromCauldron({
      onlyReleasedVersions: true,
      message: 'Please select a source native application descriptor'
    })
  }

  if (targetDescriptors.length === 0) {
    targetDescriptors = await utils.askUserToChooseOneOrMoreNapDescriptorFromCauldron({
      onlyReleasedVersions: true,
      message: 'Please select one or more target native application descriptor(s)'
    })
  }

  const sourceNapDescriptor = NativeApplicationDescriptor.fromString(sourceDescriptor)

  await utils.logErrorAndExitIfNotSatisfied({
    isCompleteNapDescriptorString: { descriptor: sourceDescriptor },
    napDescriptorExistInCauldron: {
      descriptor: targetDescriptors,
      extraErrorMessage: 'You cannot CodePush to a non existing native application version.'
    }
  })

  try {
    if (!sourceDeploymentName) {
      sourceDeploymentName = await askUserForCodePushDeploymentName(
        sourceNapDescriptor,
        'Please select a source deployment environment')
    }

    if (!targetDeploymentName) {
      targetDeploymentName = await askUserForCodePushDeploymentName(
        sourceNapDescriptor,
        'Please select a target deployment environment')
    }

    const targetNapDescriptors = _.map(targetDescriptors, d => NativeApplicationDescriptor.fromString(d))

    await performCodePushPromote(
      sourceNapDescriptor,
      targetNapDescriptors,
      sourceDeploymentName,
      targetDeploymentName, {
        mandatory,
        rollout
      })
  } catch (e) {
    Utils.logErrorAndExitProcess(e)
  }
}
