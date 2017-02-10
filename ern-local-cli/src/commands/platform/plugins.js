import chalk from 'chalk';
import platform from '../../util/platform.js';
import tagOneLine from '../../util/tagOneLine.js'
const log = require('console-log-level')();

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
  const plugins = platform.getManifestPlugins(argv.platformVersion ?
    argv.platformVersion : platform.currentVersion);

  log.info(
    tagOneLine`Platform v${argv.platformVersion ? argv.platformVersion : platform.currentVersion}
    suports the following plugins`)
  for (const plugin of plugins) {
    console.log(
      `${chalk.yellow(`${plugin.name}`)}@${chalk.magenta(`${plugin.version}`)}`);
  }
}
