// @flow

import {
  NativeApplicationDescriptor
} from '@walmart/ern-util'
import cauldron from '../../../lib/cauldron'

exports.command = 'binary <completeNapDescriptor>'
exports.desc = 'Get the native binary of a given native application'

exports.builder = {}

exports.handler = async function (argv: any) {
  const napDescriptor = NativeApplicationDescriptor.fromString(argv.completeNapDescriptor)
  await cauldron.getNativeBinary(napDescriptor)
}
