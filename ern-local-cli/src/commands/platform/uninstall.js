// @flow

import {
  Platform
} from '@walmart/ern-util'

exports.command = 'uninstall <platformVersion>'
exports.desc = 'Uninstall a given ern platform version'

exports.builder = {}

exports.handler = function ({
  platformVersion
} : {
  platformVersion: string
}) {
  Platform.uninstallPlatform(platformVersion.toString().replace('v', ''))
}
