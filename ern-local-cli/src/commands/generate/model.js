import initModelGen from "../../../../ern-model-gen/index.js";
const log = require('console-log-level')();

exports.command = 'model'
exports.desc = 'Run model generator'

exports.builder = function(yargs) {
  return yargs;
}

exports.handler = async function (argv) {
  try {
    initModelGen()
  } catch(e) {
    console.error(e);
  }
}
