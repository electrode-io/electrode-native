// @flow

import {
  NativeApplicationDescriptor,
  utils as coreUtils
} from 'ern-core'
import {
  performCodePushPromote,
  askUserForCodePushDeploymentName
} from '../../lib/publication'
import utils from '../../lib/utils'
import _ from 'lodash'
import inquirer from 'inquirer'

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
    .option('targetSemVerDescriptor', {
      describe: 'A target native application descriptor using a semver expression for the version'
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
    .option('force', {
      alias: 'f',
      type: 'bool',
      describe: 'Force upgrade (ignore compatibility issues -at your own risks-)'
    })
    .option('skipConfirmation', {
      describe: 'Skip confirmation prompts',
      alias: 's',
      type: 'bool'
    })
    .epilog(utils.epilog(exports))
}

exports.handler = async function ({
  sourceDescriptor,
  targetDescriptors = [],
  targetSemVerDescriptor,
  sourceDeploymentName,
  targetDeploymentName,
  platform,
  mandatory,
  rollout,
  skipConfirmation,
  force
} : {
  sourceDescriptor?: string,
  targetDescriptors?: Array<string>,
  targetSemVerDescriptor?: string,
  sourceDeploymentName?: string,
  targetDeploymentName?: string,
  platform: 'android' | 'ios',
  mandatory?: boolean,
  rollout?: number,
  skipConfirmation?: boolean,
  force?: boolean
}) {
  try {
    let targetNapDescriptors

    if (!sourceDescriptor) {
      sourceDescriptor = await utils.askUserToChooseANapDescriptorFromCauldron({
        onlyReleasedVersions: true,
        message: 'Please select a source native application descriptor'
      })
    } else {
      await utils.askUserToChooseANapDescriptorFromCauldron({
        isCompleteNapDescriptorString: {
          descriptor: sourceDescriptor
        }
      })
    }

    if (targetDescriptors.length > 0) {
      // User provided one or more target descriptor(s)
      await utils.logErrorAndExitIfNotSatisfied({
        napDescriptorExistInCauldron: {
          descriptor: targetDescriptors,
          extraErrorMessage: 'You cannot CodePush to a non existing native application version.'
        }
      })
    } else if (targetDescriptors.length === 0 && !targetSemVerDescriptor) {
      // User provided no target descriptors, nor a target semver descriptor
      targetDescriptors = await utils.askUserToChooseOneOrMoreNapDescriptorFromCauldron({
        onlyReleasedVersions: true,
        message: 'Please select one or more target native application descriptor(s)'
      })
    } else if (targetSemVerDescriptor) {
      // User provided a target semver descriptor
      const targetSemVerNapDescriptor = NativeApplicationDescriptor.fromString(targetSemVerDescriptor)
      targetNapDescriptors = await utils.getDescriptorsMatchingSemVerDescriptor(targetSemVerNapDescriptor)
      if (targetNapDescriptors.length === 0) {
        throw new Error(`No versions matching ${targetSemVerDescriptor} were found`)
      } else {
        log.info('CodePush release will target the following native application descriptors :')
        for (const targetNapDescriptor of targetNapDescriptors) {
          log.info(`- ${targetNapDescriptor.toString()}`)
        }
        if (!skipConfirmation) {
          const { userConfirmedVersions } = await inquirer.prompt([{
            type: 'confirm',
            name: 'userConfirmedVersions',
            message: 'Do you confirm ?'
          }])
          if (!userConfirmedVersions) {
            throw new Error('Aborting command execution')
          }
        }
      }
    }

    await utils.logErrorAndExitIfNotSatisfied({
      sameNativeApplicationAndPlatform: {
        descriptors: targetDescriptors,
        extraErrorMessage: 'You can only pass descriptors that match the same native application and version'
      }
    })

    const sourceNapDescriptor = NativeApplicationDescriptor.fromString(sourceDescriptor)

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

    if (!targetNapDescriptors) {
      targetNapDescriptors = _.map(targetDescriptors, d => NativeApplicationDescriptor.fromString(d))
    }

    await performCodePushPromote(
      sourceNapDescriptor,
      targetNapDescriptors,
      sourceDeploymentName,
      targetDeploymentName, {
        force,
        mandatory,
        rollout
      })
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}
