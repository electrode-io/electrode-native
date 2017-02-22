import {explodeNapSelector} from '@walmart/ern-util';
import {checkCompatibilityWithNativeApp} from '../../../lib/compatibility';
exports.command = 'nativeapp <napSelector> [verbose]';
exports.desc = 'Check the compatibility of the miniapp with given native app(s)';

exports.builder = function (yargs) {
    return yargs
        .option('verbose', {
            type: 'bool',
            describe: 'Verbose output'
        });
};

exports.handler = function (argv) {
    if (argv.napSelector) {
        checkCompatibilityWithNativeApp(argv.verbose,
            ...explodeNapSelector(argv.napSelector));
    } else {
        checkCompatibilityWithNativeApp(argv.verbose);
    }
};
