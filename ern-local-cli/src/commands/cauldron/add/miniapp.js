import { nativeCompatCheck } from '../../../util/compatibility.js'
import explodeNativeAppSelector from '../../../util/explodeNapSelector.js';
import { addMiniAppToNativeAppInCauldron } from '../../../util/miniapp.js';

exports.command = 'miniapp <fullNapSelector>'
exports.desc = 'Publish mini app to given native app'

exports.builder = {}

exports.handler = function (argv) {
  addMiniAppToNativeAppInCauldron(...explodeNativeAppSelector(argv.fullNapSelector));
}
