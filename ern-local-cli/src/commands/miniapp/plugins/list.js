import chalk from 'chalk';
const log = require('console-log-level')();
import { getLocalNativeDependencies } from '../../../util/miniapp.js';

exports.command = 'list'
exports.desc = 'List plugins currently included in this miniapp'

exports.builder = {}

exports.handler = function (argv) {
  const plugins = getLocalNativeDependencies();

  for (const plugin of plugins) {
    log.info(`${chalk.yellow(plugin.name)}@${chalk.magenta(plugin.version)}`);
  }
}
