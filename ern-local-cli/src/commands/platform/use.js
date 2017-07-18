// @flow

import {
  Platform
} from '@walmart/ern-core'

exports.command = 'use <platformVersion>'
exports.desc = 'Switch to a given ern platform version'

exports.builder = {}

exports.handler = function ({
  platformVersion
} : {
  platformVersion: string
}) {
  return Platform.switchToVersion(platformVersion.toString().replace('v', ''))
}
