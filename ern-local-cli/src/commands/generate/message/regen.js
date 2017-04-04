import {regenerateCode} from '@walmart/ern-api-gen'
import {platform} from '@walmart/ern-util'

const log = require('console-log-level')();

exports.command = 'regen';
exports.desc = 'Regenerates an api';

exports.builder = function (yargs) {
    return yargs.option('updatePlugin', {
        alias: 'u',
        describe: 'Update plugin version'
    }).option('bridgeVersion', {alias: 'b', describe: 'Bridge version to use'})
};

exports.handler = async function ({updatePlugin, bridgeVersion} = {}) {
    const version = bridgeVersion || platform.getPlugin('@walmart/react-native-electrode-bridge').version;
    return regenerateCode({bridgeVersion: version, updatePlugin});
};
