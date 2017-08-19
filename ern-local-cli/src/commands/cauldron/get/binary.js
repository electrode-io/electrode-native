// @flow

import {
  NativeApplicationDescriptor
} from 'ern-util'
import {
  cauldron
} from 'ern-core'
import utils from '../../../lib/utils'

exports.command = 'binary <completeNapDescriptor>'
exports.desc = 'Get the native binary of a given native application'

exports.builder = {}

exports.handler = async function ({
  completeNapDescriptor
} : {
  completeNapDescriptor: string
}) {
  await utils.logErrorAndExitIfNotSatisfied({
    isCompleteNapDescriptorString: completeNapDescriptor
  })

  await cauldron.getNativeBinary(NativeApplicationDescriptor.fromString(completeNapDescriptor))
}
