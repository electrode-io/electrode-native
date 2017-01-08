import cauldron from '../../../util/cauldron.js';
import explodeNapSelector from '../../../util/explodeNapSelector.js';

exports.command = 'nativeapp <napSelector> <platformVersion>'
exports.desc = 'Add a native application to the cauldron'

exports.builder = {}

exports.handler = function (argv) {
  cauldron.addNativeApp(
    argv.platformVersion,
    ...explodeNapSelector(argv.napSelector));
}
