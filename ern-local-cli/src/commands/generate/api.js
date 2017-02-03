import platform from '../../util/platform.js'
import generateApi from '../../../../ern-api-gen/index.js'
const log = require('console-log-level')();

exports.command = 'api [publishToNpm] [modelsSchemaPath]'
exports.desc = 'Run api generator'

exports.builder = function(yargs) {
  return yargs
  .option('publishToNpm', {
    alias: 'p',
    type: 'bool',
    default: false,
    describe: 'Verbose output'
  })
  .option('modelsSchemaPath', {
    describe: 'Path to the models schema'
  });;
}

exports.handler = async function (argv) {
  try {
    const bridgeDep = platform.getPlugin('@walmart/react-native-electrode-bridge');
    await generateApi({
      bridgeVersion: `${bridgeDep.version}`,
      shouldPublishToNpm: argv.publishToNpm,
      modelsSchemaPath: argv.modelsSchemaPath
    });
  } catch(e) {
    log.error(e);
  }
}
