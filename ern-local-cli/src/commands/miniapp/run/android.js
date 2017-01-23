import { runInAndroidRunner } from '../../../util/miniapp.js';

exports.command = 'android'
exports.desc = 'Run miniapp in android runner project'

exports.builder = function(yargs) {
  return yargs
  .option('verbose', {
    type: 'bool',
    describe: 'Verbose output'
  });
}

exports.handler = function (argv) {
  runInAndroidRunner(argv.verbose);
}
