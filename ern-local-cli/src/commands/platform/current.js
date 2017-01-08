import platform from '../../util/platform.js';
import { logInfo } from '../../util/log.js';

exports.command = 'current'
exports.desc = 'Show current platform version'

exports.builder = {}

exports.handler = function (argv) {
  logInfo(`Platform version : v${platform.currentVersion}`);
}
