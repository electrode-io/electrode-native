import {cauldron, explodeNapSelector} from '@walmart/ern-util';


exports.command = 'nativeapp <fullNapSelector> [isReleased]';
exports.desc = 'Update a native application info in cauldron';

exports.builder = function (yargs) {
    return yargs
        .option('isReleased', {
            alias: 'r',
            type: 'bool',
            describe: 'true if version is released, false otherwise'
        }).demandCommand(1, 'nativeapp needs <fullNapSelector>');
};

exports.handler = async function (argv) {
    if (argv.isReleased !== undefined) {
        cauldron.updateNativeAppIsReleased(...explodeNapSelector(argv.fullNapSelector),
            argv.isReleased);
    }
};
