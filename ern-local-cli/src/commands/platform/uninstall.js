// @flow

import {
  Platform
} from 'ern-core'

exports.command = 'uninstall <platformVersion>'
exports.desc = 'Uninstall a given ern platform version'

exports.builder = {}

exports.handler = function ({
  platformVersion
} : {
  platformVersion: string
}) {
  try {
    Platform.uninstallPlatform(platformVersion.toString().replace('v', ''))
  } catch (e) {
    log.error(e)
  }
}
