// @flow

import {
  MiniApp
} from '@walmart/ern-core'

exports.command = 'create-miniapp <appName> [platformVersion] [scope]'
exports.desc = 'Create a new ern application(miniapp)'

exports.builder = function (yargs: any) {
  return yargs
    .option('platformVersion', {
      alias: 'v',
      type: 'string',
      describe: 'Overrides current platform version in use with this platform version'
    })
    .option('scope', {
      describe: 'specify npm scope to group related packages together'
    })
}

exports.handler = async function ({
  appName,
  platformVersion,
  scope
} : {
  appName: string,
  platformVersion: string,
  scope?: string,
}) {
  await MiniApp.create(appName, {
    platformVersion: platformVersion && platformVersion.replace('v', ''),
    scope
  })
}
