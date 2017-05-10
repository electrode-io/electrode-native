import {cauldron, explodeNapSelector} from '@walmart/ern-util';

exports.command = 'nativeapp <napSelector>';
exports.desc = 'Remove a native application from the cauldron';

exports.builder = {};

exports.handler = async function (argv) {
    await cauldron.removeNativeApp(
        ...explodeNapSelector(argv.napSelector));
};
