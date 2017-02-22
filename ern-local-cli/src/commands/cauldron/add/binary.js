import {explodeNapSelector, cauldron} from '@walmart/ern-util';

exports.command = 'binary <fullNapSelector> <path>'
exports.desc = 'Add a native binary (.app or .apk) in the cauldron'

exports.builder = {}

exports.handler = function (argv) {
    cauldron.addNativeBinary(
        argv.path,
        ...explodeNapSelector(arv.fullNapSelector));
}
