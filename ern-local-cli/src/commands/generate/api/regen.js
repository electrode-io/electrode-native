import {
  platform
} from '@walmart/ern-util'
import {
  regenerateCode
} from '@walmart/ern-api-gen'

exports.command = 'regen'
exports.desc = 'Regenerates an existing api'

exports.builder = function (yargs) {
  return yargs.option('updatePlugin', {
    alias: 'u',
    describe: 'Update plugin version'
  }).option('bridgeVersion', {alias: 'b', describe: 'Bridge version to use'})
}

exports.handler = async function ({updatePlugin, bridgeVersion} = {}) {
  const version = bridgeVersion || platform.getPlugin('@walmart/react-native-electrode-bridge').version
  return regenerateCode({bridgeVersion: version, updatePlugin})
}
