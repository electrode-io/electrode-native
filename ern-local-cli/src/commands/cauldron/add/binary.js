import cauldron from '../../../util/cauldron.js';
import explodeNapSelector from '../../../util/explodeNapSelector.js';

exports.command = 'binary <fullNapSelector> <path>'
exports.desc = 'Add a native binary (.app or .apk) in the cauldron'

exports.builder = {}

exports.handler = function (argv) {
  cauldron.addNativeBinary(
    argv.path,
    ...explodeNativeappSelector(arv.fullNapSelector));
}
