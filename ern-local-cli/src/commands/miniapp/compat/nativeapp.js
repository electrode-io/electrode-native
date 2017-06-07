// @flow

import {
  NativeApplicationDescriptor
} from '@walmart/ern-util'
import {
  checkCompatibilityWithNativeApp
} from '../../../lib/compatibility'

exports.command = 'nativeapp <napDescriptor>'
exports.desc = 'Check the compatibility of the miniapp with given native app(s)'

exports.builder = function (yargs: any) {
  return yargs
}

exports.handler = function (argv: any) {
  const napDescriptor = NativeApplicationDescriptor.fromString(argv.napDescriptor)
  checkCompatibilityWithNativeApp(napDescriptor.name, napDescriptor.platform, napDescriptor.version)
}
