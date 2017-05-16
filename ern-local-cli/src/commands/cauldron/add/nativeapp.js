import {explodeNapSelector} from '@walmart/ern-util'
import cauldron from '../../../lib/cauldron'

exports.command = 'nativeapp <fullNapSelector> [platformVersion]'
exports.desc = 'Add a native application to the cauldron'

exports.builder = function (yargs) {
  return yargs
  .option('platformVersion', {
    alias: 'v',
    describe: 'Platform version'
  })
}

exports.handler = async function (argv) {
  const explodedNapSelector = explodeNapSelector(argv.fullNapSelector)
  if (explodedNapSelector.length !== 3) {
    return console.log('You need to provide a fullNapSelector to this command !')
  }
  await cauldron.addNativeApp(argv.platformVersion 
    ? argv.platformVersion.toString().replace('v', '') 
    : undefined
    , ...explodedNapSelector);
}
