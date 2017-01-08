import chalk from 'chalk';
import { getLocalNativeDependencies } from '../../../util/miniapp.js';

exports.command = 'list'
exports.desc = 'List plugins currently included in this miniapp'

exports.builder = {}

exports.handler = function (argv) {
  const plugins = getLocalNativeDependencies();

  for (const plugin of plugins) {
    console.log(`${chalk.yellow(plugin.name)}@${chalk.magenta(plugin.version)}`);
  }
}
