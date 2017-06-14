// @flow

import {
  NativeApplicationDescriptor
} from '@walmart/ern-util'
import cauldron from '../../../lib/cauldron'

exports.command = 'nativeapp <napDescriptor>'
exports.desc = 'Get a native application from the cauldron'

exports.builder = {}

exports.handler = function ({
  napDescriptor
} : {
  napDescriptor: string
}) {
  cauldron.getNativeApp(NativeApplicationDescriptor.fromString(napDescriptor)).then(res => {
    log.info(JSON.stringify(res, null, 1))
  })
}
