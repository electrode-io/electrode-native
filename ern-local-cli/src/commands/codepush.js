// @flow

import {
  NativeApplicationDescriptor
} from '@walmart/ern-util'
import {
  publishOta
} from '../lib/publication'

exports.command = 'codepush'
exports.desc = 'CodePush a MiniApp'

exports.builder = function (yargs: any) {
  return yargs
    .option('completeNapDescriptor', {
      alias: 'n',
      describe: 'Full native application selector'
    })
    .option('force', {
      alias: 'f',
      type: 'bool',
      describe: 'Force upgrade'
    })
    .option('appName', {
      describe: 'Application name'
    })
    .option('deploymentName', {
      describe: 'Deployment to release the update to',
      alias: 'd',
      type: 'string'
    })
    .option('platform', {
      describe: '=Platform name (android / ios)',
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
      type: 'boolean',
      default: false
    })
    .option('rollout', {
      describe: 'Percentage of users this release should be immediately available to',
      alias: 'r',
      type: 'string',
      default: '100%'
    })
}

exports.handler = function ({
  force,
  completeNapDescriptor,
  appName,
  deploymentName,
  platform,
  targetBinaryVersion,
  mandatory,
  rollout
} : {
  force: boolean,
  completeNapDescriptor: string,
  appName: string,
  deploymentName: string,
  platform: 'android' | 'ios',
  targetBinaryVersion: string,
  mandatory: boolean,
  rollout: string
}) {
  const napDescriptor = NativeApplicationDescriptor.fromString(completeNapDescriptor)

  return publishOta(napDescriptor, {
    force: force,
    codePushAppName: appName,
    codePushDeploymentName: deploymentName,
    codePushPlatformName: platform,
    codePushTargetVersionName: targetBinaryVersion,
    codePushIsMandatoryRelease: mandatory,
    codePushRolloutPercentage: rollout
  })
}
