import {config as ernConfig} from '@walmart/ern-util';
const log = require('console-log-level')();

exports.command = 'config <key> [value]';
exports.desc = 'Get or set a configuration key';

exports.builder = function (yargs) {
    return yargs
        .option('value', {
            alias: 'v',
            describe: 'Value to set for the key'
        })
};

exports.handler = function (argv) {
    if (argv.value) {
        ernConfig.setValue(argv.key, argv.value);
    } else {
        log.info(`${argv.key}: ${ernConfig.getValue(argv.key)}`);
    }
};
