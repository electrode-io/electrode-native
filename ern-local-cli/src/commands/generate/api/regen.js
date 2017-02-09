import platform from '../../../util/platform.js'
import {gee} from '../../../../../ern-api-gen/index.js'
const log = require('console-log-level')();

exports.command = 'regen';
exports.desc = 'Regenerates an api';

exports.builder = function (yargs) {
    return yargs.option('baseDir', {
        alias: 'b',
        describe: 'Path to base directory'
    });
};

exports.handler = async function (argv) {
    try {
        const bridgeDep = platform.getPlugin('@walmart/react-native-electrode-bridge');
        await generateCode({bridgeVersion: `${bridgeDep.version}`});
    } catch (e) {
        log.error(e);
    }
};
