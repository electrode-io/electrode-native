import platform from '../../util/platform.js'
import generateApi from '../../../../ern-api-gen/index.js'

exports.command = 'api [publishToNpm]'
exports.desc = 'Run api generator'

exports.builder = function(yargs) {
  return yargs
  .option('publishToNpm', {
    alias: 'p',
    type: 'bool',
    default: false,
    describe: 'Verbose output'
  });
}

exports.handler = async function (argv) {
  try {
    const bridgeDep = platform.getDependency('@walmart/react-native-electrode-bridge');
    generateApi({
      bridgeVersion: `${bridgeDep.version}`,
      shouldPublishToNpm: argv.publishToNpm
    });
  } catch(e) {
    logError(`[ern apigen] ${e}`);
  }
}
