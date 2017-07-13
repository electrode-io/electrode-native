// @flow

import {
  NativeApplicationDescriptor
} from '@walmart/ern-util'
import {
  checkCompatibilityWithNativeApp
} from '../../../lib/compatibility'
import MiniApp from '../../../lib/MiniApp'

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
  checkCompatibilityWithNativeApp(MiniApp.fromCurrentPath(), descriptor.name, descriptor.platform, descriptor.version)
}
