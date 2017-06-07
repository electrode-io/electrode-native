// @flow

import {
  NativeApplicationDescriptor
} from '@walmart/ern-util'
import cauldron from '../../../lib/cauldron'

exports.command = 'binary <completeNapDescriptor> <path>'
exports.desc = 'Add a native binary (.app or .apk) in the cauldron'

exports.builder = {}

exports.handler = async function (argv: any) {
  await cauldron.addNativeBinary(
    NativeApplicationDescriptor.fromString(argv.completeNapDescriptor),
    argv.path)
}
