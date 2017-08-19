// @flow

import {
  NativeApplicationDescriptor
} from 'ern-util'
import {
  cauldron
} from 'ern-core'
import utils from '../../../lib/utils'

exports.command = 'nativeapp <descriptor>'
exports.desc = 'Get a native application from the cauldron'

exports.builder = {}

exports.handler = async function ({
  descriptor
} : {
  descriptor: string
}) {
  utils.logErrorAndExitIfNotSatisfied({
    isCompleteNapDescriptorString: descriptor
  })

  const nativeApp = await cauldron.getNativeApp(NativeApplicationDescriptor.fromString(descriptor))
  log.info(JSON.stringify(nativeApp, null, 1))
}
