// @flow

import {
  Dependency,
  NativeApplicationDescriptor
} from 'ern-util'
import {
  performCodePushOtaUpdate
} from '../lib/publication'
import _ from 'lodash'

exports.command = 'code-push'
exports.desc = 'CodePush one or more MiniApp(s) versions to a target native application version'

exports.builder = function (yargs: any) {
  return yargs
    .option('completeNapDescriptor', {
      alias: 'n',
      required: true,
      describe: 'Full native application selector (target native application version for the push)'
    })
    .option('miniapps', {
      required: true,
      type: 'array',
      describe: 'The list of MiniApps to include in this CodePush bundle'
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
      alias: 'd',
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
  miniapps,
  completeNapDescriptor,
  appName,
  deploymentName,
  platform,
  targetBinaryVersion,
  mandatory,
  rollout
} : {
  force: boolean,
  miniapps: Array<string>,
  completeNapDescriptor: string,
  appName: string,
  deploymentName: string,
  platform: 'android' | 'ios',
  targetBinaryVersion: string,
  mandatory: boolean,
  rollout: string
}) {
  return performCodePushOtaUpdate(
    NativeApplicationDescriptor.fromString(completeNapDescriptor),
    _.map(miniapps, Dependency.fromString), {
      force: force,
      codePushAppName: appName,
      codePushDeploymentName: deploymentName,
      codePushPlatformName: platform,
      codePushTargetVersionName: targetBinaryVersion,
      codePushIsMandatoryRelease: mandatory,
      codePushRolloutPercentage: rollout
    })
}
