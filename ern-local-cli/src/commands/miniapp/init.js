import MiniApp from '../../lib/miniapp'

exports.command = 'init <appName> [platformVersion] [napSelector] [scope]'
exports.desc = 'Create a new ern application'

exports.builder = function (yargs) {
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
          describe: 'Creates an headless (without ui) miniapp'
        })
}

exports.handler = async function (argv) {
  await MiniApp.create(argv.appName, {
    platformVersion: argv.platfomrversion && argv.platformVersion.replace('v', ''),
    scope: argv.scope,
    headless: argv.headless
  })
}
