// @flow

import {
  Dependency,
  NativeApplicationDescriptor
} from 'ern-util'
import {
  cauldron
} from 'ern-core'
import {
  performCodePushOtaUpdate
} from '../lib/publication'
import utils from '../lib/utils'
import _ from 'lodash'

exports.command = 'code-push <miniapps..>'
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
      describe: 'Force upgrade (ignore compatiblity issues -at your own risks-)'
    })
    .option('appName', {
      describe: 'Application name'
    })
    .option('deploymentName', {
      describe: 'Deployment to release the update to',
      type: 'string'
    })
    .option('platform', {
      describe: 'Platform name (android / ios)',
      alias: 'p',
      type: 'string'
    })
    .option('targetBinaryVersion', {
      describe: 'Semver expression that specifies the binary app version(s) this release is targeting (e.g. 1.1.0, ~1.2.3)',
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
      type: 'string',
      default: '100%'
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
  targetBinaryVersion,
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
  targetBinaryVersion: string,
  mandatory: boolean,
  rollout: string,
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
      extraErrorMessage: 'You cannot CodePush to a non existin native application version.'
    },
    noGitOrFilesystemPath: {
      obj: miniapps,
      extraErrorMessage: 'You cannot provide dependencies using git or file schme for this command. Only the form miniapp@version is allowed.'
    },
    publishedToNpm: {
      obj: miniapps,
      extraErrorMessage: 'You can only CodePush MiniApps versions that have been published to NPM'
    }
  })

  const pathToYarnLock = await cauldron.getPathToYarnLock(napDescriptor)
  await performCodePushOtaUpdate(
    napDescriptor,
    _.map(miniapps, Dependency.fromString), {
      force: force,
      codePushAppName: appName,
      codePushDeploymentName: deploymentName,
      codePushPlatformName: platform,
      codePushTargetVersionName: targetBinaryVersion,
      codePushIsMandatoryRelease: mandatory,
      codePushRolloutPercentage: rollout,
      pathToYarnLock: pathToYarnLock || undefined,
      skipConfirmation
    })
}
