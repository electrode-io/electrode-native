import platform from '../../util/platform.js';

exports.command = 'install <platformVersion>'
exports.desc = 'Install a given ern platform version'

exports.builder = {}

exports.handler = function (argv) {
  platform.installPlatform(argv.platformVersion.toString());
}
