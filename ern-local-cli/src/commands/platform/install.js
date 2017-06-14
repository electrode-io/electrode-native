// @flow

import {
  Platform
} from '@walmart/ern-util'

exports.command = 'install <platformVersion>'
exports.desc = 'Install a given ern platform version'

exports.builder = {}

exports.handler = function ({
  platformVersion
} : {
  platformVersion: string
}) {
  Platform.installPlatform(platformVersion.toString().replace('v', ''))
}
