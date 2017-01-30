import cauldron from '../../../util/cauldron.js';
import explodeNapSelector from '../../../util/explodeNapSelector.js';

exports.command = 'nativeapp <fullNapSelector> [isReleased]'
exports.desc = 'Update a native application info in cauldron'

exports.builder = function(yargs) {
  return yargs
    .option('isReleased', {
      alias: 'r',
      type: 'bool',
      describe: 'true if version is released, false otherwise'
    })
}

exports.handler = async function (argv) {
  if (argv.isReleased !== undefined) {
    cauldron.updateNativeAppIsReleased(...explodeNapSelector(argv.fullNapSelector),
    argv.isReleased);
  }
}
