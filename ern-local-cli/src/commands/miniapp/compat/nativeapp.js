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

exports.handler = function ({
  napDescriptor
} : {
  napDescriptor: string
}) {
  const descriptor = NativeApplicationDescriptor.fromString(napDescriptor)
  checkCompatibilityWithNativeApp(descriptor.name, descriptor.platform, descriptor.version)
}
