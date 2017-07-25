// @flow

import {
  NativeApplicationDescriptor
} from 'ern-util'
import {
  cauldron
} from 'ern-core'

exports.command = 'nativeapp <napDescriptor>'
exports.desc = 'Remove a native application from the cauldron'

exports.builder = {}

exports.handler = async function ({
  napDescriptor
} : {
  napDescriptor: string
}) {
  await cauldron.removeNativeApp(NativeApplicationDescriptor.fromString(napDescriptor))
}
