import platform from '../../util/platform.js';

exports.command = 'use <platformVersion>'
exports.desc = 'Switch to a given ern platform version'

exports.builder = {}

exports.handler = function (argv) {
  platform.switchToVersion(argv.platformVersion.toString().replace('v',''));
}
