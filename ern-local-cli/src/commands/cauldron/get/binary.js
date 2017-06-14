// @flow

import {
  NativeApplicationDescriptor
} from '@walmart/ern-util'
import cauldron from '../../../lib/cauldron'

exports.command = 'binary <completeNapDescriptor>'
exports.desc = 'Get the native binary of a given native application'

exports.builder = {}

exports.handler = async function ({
  completeNapDescriptor
} : {
  completeNapDescriptor: string
}) {
  await cauldron.getNativeBinary(NativeApplicationDescriptor.fromString(completeNapDescriptor))
}
