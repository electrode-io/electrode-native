import chalk from 'chalk';
import { logInfo } from '../../util/log.js';
import platform from '../../util/platform.js';
import tagOneLine from '../../util/tagOneLine.js'

exports.command = 'install <platformVersion>'
exports.desc = 'Install a given ern platform version'

exports.builder = {}

exports.handler = function (argv) {
  platform.installPlatformVersion(argv.platformVersion.toString());
}
