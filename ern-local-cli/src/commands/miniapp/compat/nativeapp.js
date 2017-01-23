import { nativeCompatCheck } from '../../../util/compatibility.js'
import explodeNativeAppSelector from '../../../util/explodeNapSelector.js';

exports.command = 'nativeapp <napSelector> [verbose]'
exports.desc = 'Check the compatibility of the miniapp with given native app(s)'

exports.builder = function(yargs) {
  return yargs
  .option('verbose', {
    type: 'bool',
    describe: 'Verbose output'
  });
}

exports.handler = function (argv) {
  if (argv.napSelector) {
    nativeCompatCheck(argv.verbose,
        ...explodeNativeAppSelector(argv.napSelector));
  } else {
    nativeCompatCheck(argv.verbose);
  }
}
