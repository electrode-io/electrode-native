// @flow

import MiniApp from '../../lib/miniapp'

exports.command = 'init <appName> [platformVersion] [scope]'
exports.desc = 'Create a new ern application'

exports.builder = function (yargs: any) {
  return yargs
        .option('platformVersion', {
          alias: 'v',
          type: 'string',
          describe: 'Force version of ern platform to use'
        })
        .option('scope', {
          describe: 'npm scope to use for this app'
        })
        .option('headless', {
          type: 'bool',
          describe: 'Creates a headless (without ui) miniapp'
        })
}

exports.handler = async function (argv: any) {
  await MiniApp.create(argv.appName, {
    platformVersion: argv.platfomrversion && argv.platformVersion.replace('v', ''),
    scope: argv.scope,
    headless: argv.headless
  })
}
