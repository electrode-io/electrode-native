import chalk from 'chalk';
import { logInfo } from '../../util/log.js';
import platform from '../../util/platform.js';
import tagOneLine from '../../util/tagOneLine.js'

exports.command = 'plugins [platformVersion]'
exports.desc = 'List supported platform plugins'

exports.builder = function(yargs) {
  return yargs
    .option('platformVersion', {
      alias: 'v',
      describe: 'Specific platform version for which to list supported plugins'
    });
}

exports.handler = function (argv) {
  const plugins = platform.getSupportedPlugins(argv.platformVersion);
  logInfo(
    tagOneLine`Platform v${argv.platformVersion ? argv.platformVersion : platform.currentVersion}
    suports the following plugins`)
  for (const plugin of plugins) {
    console.log(
      `${chalk.yellow(`${plugin.name}`)}@${chalk.magenta(`${plugin.version}`)}`);
  }
}
