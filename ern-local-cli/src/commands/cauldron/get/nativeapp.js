// @flow

import {
  NativeApplicationDescriptor
} from 'ern-util'
import {
  cauldron
} from 'ern-core'
import Ensure from '../../../lib/Ensure'

exports.command = 'nativeapp <completeNapDescriptor>'
exports.desc = 'Get a native application from the cauldron'

exports.builder = {}

exports.handler = async function ({
  completeNapDescriptor
} : {
  completeNapDescriptor: string
}) {
  Ensure.isCompleteNapDescriptorString(completeNapDescriptor)
  const nativeApp = await cauldron.getNativeApp(NativeApplicationDescriptor.fromString(completeNapDescriptor))
  log.info(JSON.stringify(nativeApp, null, 1))
}
