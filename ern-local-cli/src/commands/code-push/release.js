// @flow

import {
  Dependency,
  NativeApplicationDescriptor,
  Utils
} from 'ern-util'
import {
  cauldron
} from 'ern-core'
import {
  performCodePushOtaUpdate,
  askUserForCodePushDeploymentName
} from '../../lib/publication'
import utils from '../../lib/utils'
import * as constants from '../../lib/constants'
import _ from 'lodash'

exports.command = 'release <miniapps..>'
exports.desc = 'CodePush one or more MiniApp(s) versions to a target native application version'

exports.builder = function (yargs: any) {
  return yargs
    .option('descriptor', {
      alias: 'd',
      describe: 'Full native application selector (target native application version for the push)'
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
      describe: 'Skip final confirmation prompt if no compatibility issues are detected',
      alias: 's',
      type: 'bool'
    })
    .epilog(utils.epilog(exports))
}

exports.handler = async function ({
  force,
  miniapps,
  descriptor,
  appName,
  deploymentName,
  platform,
  mandatory,
  rollout,
  skipConfirmation
} : {
  force: boolean,
  miniapps: Array<string>,
  descriptor?: string,
  appName: string,
  deploymentName: string,
  platform: 'android' | 'ios',
  mandatory?: boolean,
  rollout?: number,
  skipConfirmation?: boolean
}) {
  if (!descriptor) {
    descriptor = await utils.askUserToChooseANapDescriptorFromCauldron({ onlyReleasedVersions: true })
  }
  const napDescriptor = NativeApplicationDescriptor.fromString(descriptor)

  await utils.logErrorAndExitIfNotSatisfied({
    isCompleteNapDescriptorString: { descriptor },
    napDescriptorExistInCauldron: {
      descriptor,
      extraErrorMessage: 'You cannot CodePush to a non existing native application version.'
    },
    noGitOrFilesystemPath: {
      obj: miniapps,
      extraErrorMessage: 'You cannot provide dependencies using git or file scheme for this command. Only the form miniapp@version is allowed.'
    },
    publishedToNpm: {
      obj: miniapps,
      extraErrorMessage: 'You can only CodePush MiniApps versions that have been published to NPM'
    }
  })

  if (!deploymentName) {
    deploymentName = await askUserForCodePushDeploymentName(napDescriptor)
  }

  try {
    const pathToYarnLock = await getPathToYarnLock(napDescriptor, deploymentName)
    await performCodePushOtaUpdate(
      napDescriptor,
      deploymentName,
      _.map(miniapps, Dependency.fromString), {
        force,
        codePushIsMandatoryRelease: mandatory,
        codePushRolloutPercentage: rollout,
        pathToYarnLock: pathToYarnLock || undefined,
        skipConfirmation
      })
  } catch (e) {
    Utils.logErrorAndExitProcess(e)
  }
}

async function getPathToYarnLock (
  napDescriptor: NativeApplicationDescriptor,
  deploymentName: string) {
  let pathToYarnLock = await cauldron.getPathToYarnLock(napDescriptor, deploymentName)
  if (!pathToYarnLock) {
    pathToYarnLock = await cauldron.getPathToYarnLock(napDescriptor, constants.CONTAINER_YARN_KEY)
  }
  return pathToYarnLock
}
