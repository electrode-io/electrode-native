import {cauldron, explodeNapSelector} from '@walmart/ern-util';

exports.command = 'nativeapp <napSelector>';
exports.desc = 'Remove a native application from the cauldron';

exports.builder = {};

exports.handler = function (argv) {
    cauldron.removeNativeApp(
        ...explodeNapSelector(argv.napSelector));
};
