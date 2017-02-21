import {cleanGenerated} from '@walmart/ern-api-gen'
const log = require('console-log-level')();

exports.command = 'clean';
exports.desc = 'Removes all generated artifacts';

exports.builder = function (yargs) {
    return yargs;
};

exports.handler = async function (argv) {
    try {
        await cleanGenerated();
    } catch (e) {
        log.error(`Cleaning project failed: ${e.message}`);
        process.exit(1);
    }
};
