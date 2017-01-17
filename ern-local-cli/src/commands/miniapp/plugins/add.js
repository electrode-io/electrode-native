import child_process from 'child_process';
import chalk from 'chalk';
import { logInfo } from '../../../util/log.js';
import platform from '../../../util/platform.js';

exports.command = 'add <name>'
exports.desc = 'Add a plugin to this miniapp'

const execSync = child_process.execSync;

exports.builder = {}

exports.handler = function (argv) {
  const plugin = platform.getDependency(argv.name);
  if (!plugin) {
    logError(`Plugin ${argv.name} is not available in current container version`);
    return;
  }

  logInfo(`Installing ${argv.name}@${plugin.version}`);
  execSync(`yarn add ${argv.name}@${plugin.version}`);
  logInfo(`done.`)
}
