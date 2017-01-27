import explodeNativeAppSelector from '../../../util/explodeNapSelector.js';
import MiniApp from '../../../util/miniapp.js';

exports.command = 'miniapp <fullNapSelector> [force]'
exports.desc = 'Publish mini app to given native app'

exports.builder = function(yargs) {
  return yargs
    .option('force', {
      alias: 'f',
      type: 'bool',
      describe: 'Force publish'
    })
}

exports.handler = async function (argv) {
  await MiniApp.fromCurrentPath().addToNativeAppInCauldron(
    ...explodeNativeAppSelector(argv.fullNapSelector), argv.force);
}
