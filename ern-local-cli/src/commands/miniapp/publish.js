// @flow

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
    .option('fullNapSelector', {
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

exports.handler = function (argv: any) {
  return publishMiniApp({
    force: argv.force,
    fullNapSelector: argv.fullNapSelector,
    npmPublish: argv.npmPublish,
    publishAsOtaUpdate: argv.ota,
    publishAsNewContainer: argv.container,
    containerVersion: argv.containerVersion,
    codePushAppName: argv.appName,
    codePushDeploymentName: argv.deploymentName,
    codePushPlatformName: argv.platform,
    codePushTargetVersionName: argv.targetBinaryVersion,
    codePushIsMandatoryRelease: argv.mandatory,
    codePushRolloutPercentage: argv.rollout
  })
}
