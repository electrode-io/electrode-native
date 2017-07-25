// @flow

import {
  NativeApplicationDescriptor
} from 'ern-util'
import {
  cauldron
} from 'ern-core'

exports.command = 'config <napDescriptor>'
exports.desc = 'Get a configuration from the cauldron'

exports.builder = {}

exports.handler = function ({
  napDescriptor
} : {
  napDescriptor: string
}) {
  cauldron.getConfig(NativeApplicationDescriptor.fromString(napDescriptor)).then(res => {
    log.info(JSON.stringify(res, null, 1))
  })
}
