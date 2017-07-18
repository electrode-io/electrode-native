// @flow

import {
  NativeApplicationDescriptor
} from '@walmart/ern-util'
import {
  cauldron
} from '@walmart/ern-core'

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
