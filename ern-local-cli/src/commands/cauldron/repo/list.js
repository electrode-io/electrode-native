// @flow

import {
  config as ernConfig,
  Utils
} from 'ern-util'
import utils from '../../../lib/utils'

exports.command = 'list'
exports.desc = 'List all Cauldron repositories'

exports.builder = function (yargs: any) {
  return yargs.epilog(utils.epilog(exports))
}

exports.handler = function () {
  try {
    const cauldronRepositories = ernConfig.getValue('cauldronRepositories')
    if (!cauldronRepositories) {
      return console.log('No Cauldron repositories have been added yet')
    }
    console.log('[Cauldron Repositories]')
    Object.keys(cauldronRepositories).forEach(alias =>
        console.log(`${alias} -> ${cauldronRepositories[alias]}`))
  } catch (e) {
    Utils.logErrorAndExitProcess(e)
  }
}
