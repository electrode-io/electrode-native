import cauldron from '../../../util/cauldron.js';
import explodeNapSelector from '../../../util/explodeNapSelector.js';
import { logInfo } from '../../../util/log.js';

exports.command = 'nativeapp <napSelector>'
exports.desc = 'Get a native application from the cauldron'

exports.builder = {}

exports.handler = function (argv) {
  cauldron.getNativeApp(
    ...explodeNapSelector(argv.napSelector)).then(res => {
      logInfo(JSON.stringify(res, null, 1));
    });
}
