import chalk from 'chalk';
import { logInfo } from '../../util/log.js';
import platform from '../../util/platform.js';
import tagOneLine from '../../util/tagOneLine.js'
import ernConfig from '../../util/config.js'

exports.command = 'config [key] [value]'
exports.desc = 'Get or set a configuration key'

exports.builder = function(yargs) {
  return yargs
    .option('key', {
      alias: 'k',
      describe: 'The key for which to get/set the value'
    })
    .option('value', {
      alias: 'v',
      describe: 'Value to set for the key'
    })
    .demandOption('key', 'key argument is required')
    .choices('key', ['cauldronUrl']);
}


exports.handler = function (argv) {
  if (argv.value) {
    ernConfig.setValue(argv.key, argv.value);
  } else {
    logInfo(`${argv.key}: ${ernConfig.getValue(argv.key)}`);
  }
}
