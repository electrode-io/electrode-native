import chalk from 'chalk';
const log = require('console-log-level')();
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
  log.info(
    tagOneLine`Platform v${argv.platformVersion ? argv.platformVersion : platform.currentVersion}
    suports the following plugins`)
  for (const plugin of plugins) {
    log.info(
      `${chalk.yellow(`${plugin.scope? `@${plugin.scope}/`:''}${plugin.name}`)}@${chalk.magenta(`${plugin.version}`)}`);
  }
}
