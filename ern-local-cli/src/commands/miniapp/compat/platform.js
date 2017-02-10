import { checkCompatibilityWithPlatform } from '../../../util/compatibility.js';

exports.command = 'platform [platformVersion]'
exports.desc = 'Check the compatibility of the miniapp with platform current or specific version'

exports.builder = function(yargs) {
  return yargs
    .option('platformVersion', {
      alias: 'v',
      describe: 'Platform version to check compatibility with'
    })
    .option('verbose', {
      type: 'bool',
      describe: 'verbose output'
    });
}

exports.handler = function (argv) {
  checkCompatibilityWithPlatform(argv.verbose, argv.platformVersion);
}
