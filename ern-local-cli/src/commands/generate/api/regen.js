import {generateCode} from '../../../../../ern-api-gen/index.js'
const log = require('console-log-level')();

exports.command = 'regen';
exports.desc = 'Regenerates an api';

exports.builder = function (yargs) {
    return yargs;
};

exports.handler = async function (argv) {
    try {
        await generateCode();
    } catch (e) {
        log.error(`Regenerating code failed:`, e.message);
        process.exit(1);

    }
};
