// @flow

import {
  Platform
} from '@walmart/ern-util'
import {
  regenerateCode
} from '@walmart/ern-api-gen'

exports.command = 'regen'
exports.desc = 'Regenerates an existing api'

exports.builder = function (yargs: any) {
  return yargs.option('updatePlugin', {
    alias: 'u',
    describe: 'Update plugin version'
  }).option('bridgeVersion', {alias: 'b', describe: 'Bridge version to use'})
}

exports.handler = async function ({
  updatePlugin,
  bridgeVersion
} : {
  updatePlugin: boolean,
  bridgeVersion: string
} = {}) {
  if (!bridgeVersion) {
    const bridgeDep = Platform.getPlugin('@walmart/react-native-electrode-bridge')
    if (!bridgeDep) {
      return log.error(`@walmart/react-native-electrode-bridge not found in manifest. please provide explicit version`)
    }
    bridgeVersion = bridgeDep.version
  }

  return regenerateCode({bridgeVersion, updatePlugin})
}
