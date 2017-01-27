import chalk from 'chalk';
const log = require('console-log-level')();
import MiniApp from '../../../util/miniapp.js';

exports.command = 'list'
exports.desc = 'List plugins currently included in this miniapp'

exports.builder = {}

exports.handler = function (argv) {
  const miniApp = MiniApp.fromCurrentPath();

  for (const plugin of miniApp.nativeDependencies) {
    log.info(`${chalk.yellow(plugin.name)}@${chalk.magenta(plugin.version)}`);
  }
}
