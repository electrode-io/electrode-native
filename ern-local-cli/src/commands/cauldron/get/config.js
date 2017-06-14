// @flow

import {
  NativeApplicationDescriptor
} from '@walmart/ern-util'
import cauldron from '../../../lib/cauldron'

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
