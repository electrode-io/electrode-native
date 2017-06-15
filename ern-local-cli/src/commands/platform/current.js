// @flow

import {
  Platform
} from '@walmart/ern-util'

exports.command = 'current'
exports.desc = 'Show current platform version'

exports.builder = {}

exports.handler = function () {
  log.info(`Platform version : v${Platform.currentVersion}`)
}
