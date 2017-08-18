// @flow

import {
  NativeApplicationDescriptor
} from 'ern-util'
import {
  cauldron
} from 'ern-core'
import Ensure from '../../../lib/Ensure'

exports.command = 'nativeapp <completeNapDescriptor>'
exports.desc = 'Remove a native application from the cauldron'

exports.builder = {}

exports.handler = async function ({
  completeNapDescriptor
} : {
  completeNapDescriptor: string
}) {
  Ensure.isCompleteNapDescriptorString(completeNapDescriptor)
  await cauldron.removeNativeApp(NativeApplicationDescriptor.fromString(completeNapDescriptor))
}
