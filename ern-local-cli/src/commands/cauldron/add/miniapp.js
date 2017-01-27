import { nativeCompatCheck } from '../../../util/compatibility.js'
import explodeNativeAppSelector from '../../../util/explodeNapSelector.js';
import MiniApp from '../../../util/miniapp.js';

exports.command = 'miniapp <fullNapSelector>'
exports.desc = 'Publish mini app to given native app'

exports.builder = {}

exports.handler = async function (argv) {
  await MiniApp.fromCurrentPath().addToNativeAppInCauldron(
    ...explodeNativeAppSelector(argv.fullNapSelector));
}
