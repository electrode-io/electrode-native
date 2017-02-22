import {platform} from '@walmart/ern-util';

exports.command = 'uninstall <platformVersion>';
exports.desc = 'Uninstall a given ern platform version';

exports.builder = {};

exports.handler = function (argv) {
    platform.uninstallPlatformVersion(argv.platformVersion.toString().replace('v', ''));
};
