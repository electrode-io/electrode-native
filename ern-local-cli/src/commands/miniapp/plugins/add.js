import child_process from 'child_process';
import chalk from 'chalk';
import { logInfo } from '../../../util/log.js';
import platform from '../../../util/platform.js';
import { spin } from '../../../util/spin.js';
import { yarnAdd } from '../../../util/yarn.js';

exports.command = 'add <name>'
exports.desc = 'Add a plugin to this miniapp'

const exec = child_process.exec;

exports.builder = {}

exports.handler = async function (argv) {
  const plugin = platform.getDependency(argv.name);
  if (!plugin) {
    logError(`Plugin ${argv.name} is not available in current container version`);
    return;
  }

  await spin(`Installing ${argv.name}@${plugin.version}`, yarnAdd(plugin));
  logInfo(`done.`)
}
