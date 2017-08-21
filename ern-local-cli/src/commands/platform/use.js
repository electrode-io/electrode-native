// @flow

import {
  Platform
} from 'ern-core'

exports.command = 'use <platformVersion>'
exports.desc = 'Switch to a given ern platform version'

exports.builder = {}

exports.handler = function ({
  platformVersion
} : {
  platformVersion: string
}) {
  try {
    Platform.switchToVersion(platformVersion.toString().replace('v', ''))
  } catch (e) {
    log.error(e.message)
  }
}
