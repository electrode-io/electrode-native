import runModelGen from "@walmart/ern-model-gen";
const log = require('console-log-level')();

exports.command = 'model [schemaPath]'
exports.desc = 'Run model generator'

exports.builder = function (yargs) {
    return yargs
        .option('schemaPath', {
            describe: 'Path to the schema file'
        });
};

exports.handler = async function (argv) {
    await  runModelGen({schemaPath: argv.schemaPath})
};
