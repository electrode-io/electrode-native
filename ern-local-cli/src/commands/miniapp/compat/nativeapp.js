import {
  explodeNapSelector
} from '@walmart/ern-util'
import {
  checkCompatibilityWithNativeApp
} from '../../../lib/compatibility'

exports.command = 'nativeapp <napSelector>'
exports.desc = 'Check the compatibility of the miniapp with given native app(s)'

exports.builder = function (yargs) {
  return yargs
}

exports.handler = function (argv) {
  checkCompatibilityWithNativeApp(...explodeNapSelector(argv.napSelector))
}
