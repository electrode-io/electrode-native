import {generateCode} from '@walmart/ern-api-gen'
import {platform} from '@walmart/ern-util'

const log = require('console-log-level')();

exports.command = 'regen';
exports.desc = 'Regenerates an api';

exports.builder = function (yargs) {
    return yargs;
};

exports.handler = async function (argv) {
    const bridgeDep = platform.getPlugin('@walmart/react-native-electrode-bridge');

    return generateCode({bridgeVersion: bridgeDep.version});

};
