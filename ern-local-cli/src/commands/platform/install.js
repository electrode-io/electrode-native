// @flow

import {
  Platform
} from 'ern-core'

exports.command = 'install <platformVersion>'
exports.desc = 'Install a given ern platform version'

exports.builder = {}

exports.handler = function ({
  platformVersion
} : {
  platformVersion: string
}) {
  try {
    Platform.installPlatform(platformVersion.toString().replace('v', ''))
  } catch (e) {
    log.error(e)
  }
}
