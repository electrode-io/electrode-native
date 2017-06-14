// @flow

import {
  NativeApplicationDescriptor
} from '@walmart/ern-util'
import {
  publishMiniApp
} from '../../lib/publication'

exports.command = 'publish'
exports.desc = 'Publish a miniapp'

exports.builder = function (yargs: any) {
  return yargs
    .option('force', {
      alias: 'f',
      type: 'bool',
      describe: 'Force publish'
    })
    .option('completeNapDescriptor', {
      alias: 'n',
      describe: 'Full native application selector'
    })
    .option('npmPublish', {
      describe: 'Publish to npm'
    })
    .option('ota', {
      describe: 'Publish as OTA update through CodePush',
      type: 'boolean',
      default: false
    })
    .option('container', {
      describe: 'Publish to a new Container version',
      type: 'boolean',
      default: false
    })
    .group(['containerVersion'], 'Container Options:')
    .option('containerVersion', {
      describe: '[Container] The version to apply to generated container',
      alias: 'v'
    })
    .group(['appName', 'deploymentName', 'platform', 'targetBinaryVersion', 'mandatory', 'rollout'], 'CodePush OTA Options:')
    .option('appName', {
      describe: '[CodePush] Application name'
    })
    .option('deploymentName', {
      describe: '[CodePush] Deployment to release the update to',
      alias: 'd',
      type: 'string'
    })
    .option('platform', {
      describe: '[CodePush] Platform name (android / ios)',
      alias: 'p',
      type: 'string'
    })
    .option('targetBinaryVersion', {
      describe: '[CodePush] Semver expression that specifies the binary app version(s) this release is targeting (e.g. 1.1.0, ~1.2.3)',
      alias: 't',
      type: 'string'
    })
    .option('mandatory', {
      describe: '[CodePush] Specifies whether this release should be considered mandatory',
      alias: 'm',
      type: 'boolean',
      default: false
    })
    .option('rollout', {
      describe: '[CodePush] Percentage of users this release should be immediately available to',
      alias: 'r',
      type: 'string',
      default: '100%'
    })
}

exports.handler = function ({
  force,
  completeNapDescriptor,
  npmPublish,
  ota,
  container,
  containerVersion,
  appName,
  deploymentName,
  platform,
  targetBinaryVersion,
  mandatory,
  rollout
} : {
  force: boolean,
  completeNapDescriptor: string,
  npmPublish: boolean,
  ota: boolean,
  container: boolean,
  containerVersion: string,
  appName: string,
  deploymentName: string,
  platform: 'android' | 'ios',
  targetBinaryVersion: string,
  mandatory: boolean,
  rollout: string
}) {
  const napDescriptor = NativeApplicationDescriptor.fromString(completeNapDescriptor)

  return publishMiniApp({
    force: force,
    napDescriptor: napDescriptor,
    npmPublish: npmPublish,
    publishAsOtaUpdate: ota,
    publishAsNewContainer: container,
    containerVersion: containerVersion,
    codePushAppName: appName,
    codePushDeploymentName: deploymentName,
    codePushPlatformName: platform,
    codePushTargetVersionName: targetBinaryVersion,
    codePushIsMandatoryRelease: mandatory,
    codePushRolloutPercentage: rollout
  })
}
