// @flow

import MiniApp from '../../lib/miniapp'

exports.command = 'miniapp <appName> [platformVersion] [scope]'
exports.desc = 'Create a new ern application(miniapp)'

exports.builder = function (yargs: any) {
  return yargs
    .option('platformVersion', {
      alias: 'v',
      type: 'string',
      describe: 'Force version of ern platform to use, if not provided it will pick the current platform version in use'
    })
    .option('scope', {
      describe: 'npm scope to use for this app'
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
