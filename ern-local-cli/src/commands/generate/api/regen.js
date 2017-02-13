import {generateCode} from '../../../../../ern-api-gen/index.js'
import platform from '../../../util/platform.js'

const log = require('console-log-level')();

exports.command = 'regen';
exports.desc = 'Regenerates an api';

exports.builder = function (yargs) {
    return yargs;
};

exports.handler = async function (argv) {
    const bridgeDep = platform.getPlugin('@walmart/react-native-electrode-bridge');

    try {
        await generateCode({bridgeVersion: bridgeDep.version});
    } catch (e) {
        log.error(`Regenerating code failed:`, e.message);
        process.exit(1);

    }
};
