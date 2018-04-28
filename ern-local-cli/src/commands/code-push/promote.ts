import { NativeApplicationDescriptor, utils as coreUtils, log } from 'ern-core'
import {
  performCodePushPromote,
  askUserForCodePushDeploymentName,
} from '../../lib/publication'
import utils from '../../lib/utils'
import _ from 'lodash'
import inquirer from 'inquirer'
import { Argv } from 'yargs'

export const command = 'promote'
export const desc =
  'Promote a CodePush release to a different deployment environment'

export const builder = (argv: Argv) => {
  return argv
    .option('sourceDescriptor', {
      describe:
        'Full native application descriptor from which to promote a release',
      type: 'string',
    })
    .option('targetDescriptors', {
      describe:
        'One or more native application descriptors matching targeted versions',
      type: 'array',
    })
    .option('targetSemVerDescriptor', {
      describe:
        'A target native application descriptor using a semver expression for the version',
    })
    .option('sourceDeploymentName', {
      describe:
        'Name of the deployment environment to promote the release from',
      type: 'string',
    })
    .option('targetDeploymentName', {
      describe: 'Name of the deployment environment to promote the release to',
      type: 'string',
    })
    .option('targetBinaryVersion', {
      alias: 't',
      describe:
        'Semver expression that specifies the binary app version(s) this release is targeting',
      type: 'string',
    })
    .option('mandatory', {
      alias: 'm',
      default: false,
      describe: 'Specifies whether this release should be considered mandatory',
      type: 'boolean',
    })
    .option('rollout', {
      alias: 'r',
      default: 100,
      describe:
        'Percentage of users this release should be immediately available to',
      type: 'number',
    })
    .option('force', {
      alias: 'f',
      describe:
        'Force upgrade (ignore compatibility issues -at your own risks-)',
      type: 'boolean',
    })
    .option('skipConfirmation', {
      alias: 's',
      describe: 'Skip confirmation prompts',
      type: 'boolean',
    })
    .option('label', {
      alias: 'l',
      describe:
        'Promote the release matching this label. If omitted, the latest release of sourceDescriptor/sourceDeploymentName pair will be promoted.',
      type: 'string',
    })
    .epilog(utils.epilog(exports))
}

export const handler = async ({
  sourceDescriptor,
  targetDescriptors = [],
  targetSemVerDescriptor,
  sourceDeploymentName,
  targetDeploymentName,
  targetBinaryVersion,
  platform,
  mandatory,
  rollout,
  skipConfirmation,
  force,
  label,
}: {
  sourceDescriptor?: string
  targetDescriptors?: string[]
  targetSemVerDescriptor?: string
  sourceDeploymentName?: string
  targetDeploymentName?: string
  targetBinaryVersion?: string
  platform: 'android' | 'ios'
  mandatory?: boolean
  rollout?: number
  skipConfirmation?: boolean
  force?: boolean
  label?: string
}) => {
  try {
    let targetNapDescriptors

    await utils.logErrorAndExitIfNotSatisfied({
      checkIfCodePushOptionsAreValid: {
        descriptors: targetDescriptors,
        semVerDescriptor: targetSemVerDescriptor,
        targetBinaryVersion,
      },
    })

    if (!sourceDescriptor) {
      sourceDescriptor = await utils.askUserToChooseANapDescriptorFromCauldron({
        message: 'Please select a source native application descriptor',
        onlyReleasedVersions: true,
      })
    } else {
      await utils.logErrorAndExitIfNotSatisfied({
        isCompleteNapDescriptorString: {
          descriptor: sourceDescriptor,
        },
      })
    }

    if (targetDescriptors.length > 0) {
      // User provided one or more target descriptor(s)
      await utils.logErrorAndExitIfNotSatisfied({
        napDescriptorExistInCauldron: {
          descriptor: targetDescriptors,
          extraErrorMessage:
            'You cannot CodePush to a non existing native application version.',
        },
      })
    } else if (targetDescriptors.length === 0 && !targetSemVerDescriptor) {
      // User provided no target descriptors, nor a target semver descriptor
      targetDescriptors = await utils.askUserToChooseOneOrMoreNapDescriptorFromCauldron(
        {
          message:
            'Please select one or more target native application descriptor(s)',
          onlyReleasedVersions: true,
        }
      )
    } else if (targetSemVerDescriptor) {
      // User provided a target semver descriptor
      const targetSemVerNapDescriptor = NativeApplicationDescriptor.fromString(
        targetSemVerDescriptor
      )
      targetNapDescriptors = await utils.getDescriptorsMatchingSemVerDescriptor(
        targetSemVerNapDescriptor
      )
      if (targetNapDescriptors.length === 0) {
        throw new Error(
          `No versions matching ${targetSemVerDescriptor} were found`
        )
      } else {
        log.info(
          'CodePush release will target the following native application descriptors :'
        )
        for (const targetNapDescriptor of targetNapDescriptors) {
          log.info(`- ${targetNapDescriptor.toString()}`)
        }
        if (!skipConfirmation) {
          const { userConfirmedVersions } = await inquirer.prompt([
            <inquirer.Question>{
              message: 'Do you confirm ?',
              name: 'userConfirmedVersions',
              type: 'confirm',
            },
          ])
          if (!userConfirmedVersions) {
            throw new Error('Aborting command execution')
          }
        }
      }
    }

    await utils.logErrorAndExitIfNotSatisfied({
      sameNativeApplicationAndPlatform: {
        descriptors: targetDescriptors,
        extraErrorMessage:
          'You can only pass descriptors that match the same native application and version',
      },
    })

    const sourceNapDescriptor = NativeApplicationDescriptor.fromString(
      sourceDescriptor
    )

    if (!sourceDeploymentName) {
      sourceDeploymentName = await askUserForCodePushDeploymentName(
        sourceNapDescriptor,
        'Please select a source deployment environment'
      )
    }

    if (!targetDeploymentName) {
      targetDeploymentName = await askUserForCodePushDeploymentName(
        sourceNapDescriptor,
        'Please select a target deployment environment'
      )
    }

    if (!targetNapDescriptors) {
      targetNapDescriptors = _.map(targetDescriptors, d =>
        NativeApplicationDescriptor.fromString(d)
      )
    }

    await performCodePushPromote(
      sourceNapDescriptor,
      targetNapDescriptors,
      sourceDeploymentName,
      targetDeploymentName,
      {
        force,
        label,
        mandatory,
        rollout,
        targetBinaryVersion,
      }
    )
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}
