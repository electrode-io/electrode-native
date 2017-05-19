import {
  platform
} from '@walmart/ern-util'

exports.command = 'use <platformVersion>'
exports.desc = 'Switch to a given ern platform version'

exports.builder = {}

exports.handler = function (argv) {
  return platform.switchToVersion(argv.platformVersion.toString().replace('v', ''))
}
