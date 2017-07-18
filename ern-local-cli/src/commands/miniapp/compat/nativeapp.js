// @flow

import {
  NativeApplicationDescriptor
} from '@walmart/ern-util'
import {
  compatibility,
  MiniApp
} from '@walmart/ern-core'

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
  compatibility.checkCompatibilityWithNativeApp(MiniApp.fromCurrentPath(), descriptor.name, descriptor.platform, descriptor.version)
}
