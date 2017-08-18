// @flow

import {
  NativeApplicationDescriptor
} from 'ern-util'
import {
  compatibility,
  MiniApp
} from 'ern-core'
import Ensure from '../../../lib/Ensure'

exports.command = 'nativeapp <completeNapDescriptor>'
exports.desc = 'Check the compatibility of the miniapp with given native app(s)'

exports.builder = function (yargs: any) {
  return yargs
}

exports.handler = function ({
  completeNapDescriptor
} : {
  completeNapDescriptor: string
}) {
  Ensure.isCompleteNapDescriptorString(completeNapDescriptor)
  const descriptor = NativeApplicationDescriptor.fromString(completeNapDescriptor)
  compatibility.checkCompatibilityWithNativeApp(MiniApp.fromCurrentPath(), descriptor.name, descriptor.platform, descriptor.version)
}
