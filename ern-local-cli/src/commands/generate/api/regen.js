import {cleanGenerated} from '../../../../../ern-api-gen/index.js'
const log = require('console-log-level')();

exports.command = 'clean';
exports.desc = 'Removes all generated artifacts';

exports.builder = function (yargs) {
    return yargs.option('baseDir', {
        alias: 'b',
        describe: 'Path to base directory'
    });
};

exports.handler = async function (argv) {
    try {
        await cleanGenerated();
    } catch (e) {
        log.error(e);
    }
};
