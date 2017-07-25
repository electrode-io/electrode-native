// @flow

import {
  NativeApplicationDescriptor
} from 'ern-util'
import {
  cauldron
} from 'ern-core'

exports.command = 'binary <completeNapDescriptor> <path>'
exports.desc = 'Add a native binary (.app or .apk) in the cauldron'

exports.builder = {}

exports.handler = async function ({
  completeNapDescriptor,
  path
} : {
  completeNapDescriptor: string,
  path: string
}) {
  await cauldron.addNativeBinary(
    NativeApplicationDescriptor.fromString(completeNapDescriptor),
    path)
}
