import { compatCheck } from '../../util/compatibility.js'
import explodeNativeAppSelector from '../../util/explodeNapSelector.js';

exports.command = 'compat-nativeapp <napSelector> [verbose]'
exports.desc = 'Check the compatibility of the miniapp with given native app(s)'

exports.builder = function(yargs) {
  return yargs
  .option('verbose', {
    alias: 'v',
    type: 'bool',
    describe: 'Verbose output'
  });
}

exports.handler = function (argv) {
  if (argv.napSelector) {
    compatCheck(argv.verbose,
        ...explodeNativeAppSelector(argv.napSelector));
  } else {
    compatCheck(argv.verbose);
  }
}
