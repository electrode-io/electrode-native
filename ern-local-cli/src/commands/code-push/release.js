// @flow

import {
  PackagePath,
  NativeApplicationDescriptor,
  utils as coreUtils
} from 'ern-core'
import {
  performCodePushOtaUpdate,
  askUserForCodePushDeploymentName
} from '../../lib/publication'
import utils from '../../lib/utils'
import * as constants from '../../lib/constants'
import _ from 'lodash'
import inquirer from 'inquirer'

exports.command = 'release'
exports.desc = 'CodePush MiniApp(s) or JS API implementation(s) version(s) to a target native application version'

exports.builder = function (yargs: any) {
  return yargs
    .option('miniapps', {
      describe: 'One or more MiniApp to CodePush',
      type: 'array'
    })
    .option('jsApiImpls', {
      describe: 'One or more JS API implementation to CodePush',
      type: 'array'
    })
    .option('descriptors', {
      alias: 'd',
      describe: 'Full native application descriptors (target native application versions for the push)',
      type: 'array'
    })
    .option('semVerDescriptor', {
      describe: 'A native application descriptor using a semver expression for the version'
    })
    .option('force', {
      alias: 'f',
      type: 'bool',
      describe: 'Force upgrade (ignore compatibility issues -at your own risks-)'
    })
    .option('appName', {
      describe: 'Application name'
    })
    .option('deploymentName', {
      describe: 'Deployment to release the update to',
      type: 'string'
    })
    .option('targetBinaryVersion', {
      describe: 'Semver expression that specifies the binary app version(s) this release is targeting',
      alias: 't',
      type: 'string'
    })
    .option('mandatory', {
      describe: 'Specifies whether this release should be considered mandatory',
      alias: 'm',
      type: 'bool',
      default: false
    })
    .option('rollout', {
      describe: 'Percentage of users this release should be immediately available to',
      alias: 'r',
      type: 'number',
      default: 100
    })
    .option('skipConfirmation', {
      describe: 'Skip confirmation prompts',
      alias: 's',
      type: 'bool'
    })
    .epilog(utils.epilog(exports))
}

exports.handler = async function ({
  force,
  miniapps = [],
  jsApiImpls = [],
  descriptors = [],
  semVerDescriptor,
  appName,
  deploymentName,
  targetBinaryVersion,
  platform,
  mandatory,
  rollout,
  skipConfirmation
} : {
  force: boolean,
  miniapps: Array<string>,
  jsApiImpls: Array<string>,
  descriptors?: Array<string>,
  semVerDescriptor?: string,
  appName: string,
  deploymentName: string,
  targetBinaryVersion?:string,
  platform: 'android' | 'ios',
  mandatory?: boolean,
  rollout?: number,
  skipConfirmation?: boolean
}) {
  try {
    let napDescriptors

    if ((miniapps.length === 0) && (jsApiImpls.length === 0)) {
      throw new Error('You need to provide at least one MiniApp or one JS API implementation version to CodePush')
    }

    await utils.logErrorAndExitIfNotSatisfied({
      checkIfCodePushOptionsAreValid: {
        descriptors,
        targetBinaryVersion,
        semVerDescriptor
      }
    })

    if (descriptors.length > 0) {
      // User provided one or more descriptor(s)
      await utils.logErrorAndExitIfNotSatisfied({
        sameNativeApplicationAndPlatform: {
          descriptors,
          extraErrorMessage: 'You can only pass descriptors that match the same native application and version'
        },
        napDescriptorExistInCauldron: {
          descriptor: descriptors,
          extraErrorMessage: 'You cannot CodePush to a non existing native application version.'
        }
      })
    } else if (descriptors.length === 0 && !semVerDescriptor) {
      // User provided no descriptors, nor a semver descriptor
      descriptors = await utils.askUserToChooseOneOrMoreNapDescriptorFromCauldron({ onlyReleasedVersions: true })
    } else if (semVerDescriptor) {
      // User provided a semver Descriptor
      const semVerNapDescriptor = NativeApplicationDescriptor.fromString(semVerDescriptor)
      napDescriptors = await utils.getDescriptorsMatchingSemVerDescriptor(semVerNapDescriptor)
      if (napDescriptors.length === 0) {
        throw new Error(`No versions matching ${semVerDescriptor} were found`)
      } else {
        log.info('CodePush release will target the following native application descriptors :')
        for (const napDescriptor of napDescriptors) {
          log.info(`- ${napDescriptor.toString()}`)
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

    if (!napDescriptors) {
      napDescriptors = _.map(descriptors, d => NativeApplicationDescriptor.fromString(d))
    }

    await utils.logErrorAndExitIfNotSatisfied({
      noGitOrFilesystemPath: {
        obj: [ ...miniapps, ...jsApiImpls ],
        extraErrorMessage: 'You cannot provide dependencies using git or file scheme for this command. Only the form miniapp@version is allowed.'
      },
      publishedToNpm: {
        obj: [ ...miniapps, ...jsApiImpls ],
        extraErrorMessage: 'You can only CodePush MiniApps versions that have been published to NPM'
      }
    })

    if (!deploymentName) {
      deploymentName = await askUserForCodePushDeploymentName(napDescriptors[0])
    }

    for (const napDescriptor of napDescriptors) {
      const pathToYarnLock = await getPathToYarnLock(napDescriptor, deploymentName)
      await performCodePushOtaUpdate(
        napDescriptor,
        deploymentName,
        _.map(miniapps, PackagePath.fromString),
        _.map(jsApiImpls, PackagePath.fromString), {
          force,
          codePushIsMandatoryRelease: mandatory,
          codePushRolloutPercentage: rollout,
          pathToYarnLock: pathToYarnLock || undefined,
          skipConfirmation,
          targetBinaryVersion
        })
    }
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

async function getPathToYarnLock (
  napDescriptor: NativeApplicationDescriptor,
  deploymentName: string) {
  const cauldron = await coreUtils.getCauldronInstance()
  if (!cauldron) {
    throw new Error('[getPathToYarnLock] No active Cauldron')
  }
  let pathToYarnLock = await cauldron.getPathToYarnLock(napDescriptor, deploymentName)
  if (!pathToYarnLock) {
    pathToYarnLock = await cauldron.getPathToYarnLock(napDescriptor, constants.CONTAINER_YARN_KEY)
  }
  return pathToYarnLock
}
