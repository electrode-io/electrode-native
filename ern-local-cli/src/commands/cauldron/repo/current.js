// @flow

import {
  config as ernConfig,
  Utils
} from 'ern-util'
import utils from '../../../lib/utils'

exports.command = 'current'
exports.desc = 'Display the currently activated Cauldron repository'

exports.builder = function (yargs: any) {
  return yargs.epilog(utils.epilog(exports))
}

exports.handler = function () {
  try {
    const cauldronRepoInUse = ernConfig.getValue('cauldronRepoInUse')
    if (!cauldronRepoInUse) {
      return console.log(`No Cauldron repository is in use yet`)
    }
    const cauldronRepositories = ernConfig.getValue('cauldronRepositories')
    console.log(`${cauldronRepoInUse} [${cauldronRepositories[cauldronRepoInUse]}]`)
  } catch (e) {
    Utils.logErrorAndExitProcess(e)
  }
}
