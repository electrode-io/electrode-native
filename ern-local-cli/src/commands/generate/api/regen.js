// @flow

import {
  Utils
} from '@walmart/ern-util'

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
  Utils.logErrorAndExitProcess(`This command is deprecated, simply type 'ern regen' from the root of the api to regenerate the api and models.`)
}
