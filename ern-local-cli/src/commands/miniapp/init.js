import MiniApp from '../../util/miniapp.js';

exports.command = 'init <appName> [platformVersion] [napSelector] [scope]'
exports.desc = 'Create a new ern application'

exports.builder = function(yargs) {
  return yargs
    .option('platformVersion', {
      alias: 'v',
      describe: 'Force version of ern platform to use'
    })
    .option('napSelector', {
      alias: 's',
      describe: 'Native application selector '
    })
    .option('scope', {
      describe: 'npm scope to use for this app'
    })
    .option('verbose', {
      type: 'bool',
      describe: 'verbose output'
    })
    .conflicts('platformVersion', 'napSelector');
}

exports.handler = async function (argv) {
  await MiniApp.create(argv.appName, {
    platformVersion: argv.platformVersion,
    napSelector: argv.napSelector,
    scope: argv.scope,
    verbose: argv.verbose
  });
}
