// @flow

import {
  Platform
} from '@walmart/ern-util'

exports.command = 'use <platformVersion>'
exports.desc = 'Switch to a given ern platform version'

exports.builder = {}

exports.handler = function (argv: any) {
  return Platform.switchToVersion(argv.platformVersion.toString().replace('v', ''))
}
