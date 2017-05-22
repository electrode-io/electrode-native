import {
  explodeNapSelector
} from '@walmart/ern-util'
import cauldron from '../../../lib/cauldron'

exports.command = 'nativeapp <napSelector>'
exports.desc = 'Remove a native application from the cauldron'

exports.builder = {}

exports.handler = async function (argv) {
  await cauldron.removeNativeApp(
        ...explodeNapSelector(argv.napSelector))
}
