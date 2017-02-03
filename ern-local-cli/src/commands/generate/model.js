import runModelGen from "../../../../ern-model-gen/index.js";
const log = require('console-log-level')();

exports.command = 'model [schemaPath]'
exports.desc = 'Run model generator'

exports.builder = function(yargs) {
  return yargs
  .option('schemaPath', {
    describe: 'Path to the schema file'
  });
}

exports.handler = async function (argv) {
  try {
    runModelGen({ schemaPath: argv.schemaPath })
  } catch(e) {
    console.error(e);
  }
}
