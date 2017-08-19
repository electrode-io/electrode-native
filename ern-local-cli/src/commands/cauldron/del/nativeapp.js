// @flow

import {
  NativeApplicationDescriptor
} from 'ern-util'
import {
  cauldron
} from 'ern-core'
import utils from '../../../lib/utils'

exports.command = 'nativeapp <completeNapDescriptor>'
exports.desc = 'Remove a native application from the cauldron'

exports.builder = {}

exports.handler = async function ({
  completeNapDescriptor
} : {
  completeNapDescriptor: string
}) {
  await utils.logErrorAndExitIfNotSatisfied({
    isCompleteNapDescriptorString: completeNapDescriptor
  })

  await cauldron.removeNativeApp(NativeApplicationDescriptor.fromString(completeNapDescriptor))
}
