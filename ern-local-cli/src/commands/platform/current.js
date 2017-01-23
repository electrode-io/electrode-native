import platform from '../../util/platform.js';

exports.command = 'current'
exports.desc = 'Show current platform version'

exports.builder = {}

exports.handler = function (argv) {
  log.info(`Platform version : v${platform.currentVersion}`);
}
