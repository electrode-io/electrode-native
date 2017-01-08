import chalk from 'chalk';
import { logInfo } from '../../util/log.js';
import platform from '../../util/platform.js';
import tagOneLine from '../../util/tagOneLine.js'

exports.command = 'uninstall <platformVersion>'
exports.desc = 'Uninstall a given ern platform version'

exports.builder = {}

exports.handler = function (argv) {
  platform.uninstallPlatformVersion(argv.platformVersion.toString());
}
