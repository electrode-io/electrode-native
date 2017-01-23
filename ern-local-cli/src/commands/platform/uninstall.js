import platform from '../../util/platform.js';

exports.command = 'uninstall <platformVersion>'
exports.desc = 'Uninstall a given ern platform version'

exports.builder = {}

exports.handler = function (argv) {
  platform.uninstallPlatformVersion(argv.platformVersion.toString());
}
