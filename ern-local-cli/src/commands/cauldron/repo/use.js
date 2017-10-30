// @flow

import {
  Platform
} from 'ern-core'
import {
  config as ernConfig,
  shell,
  Utils
} from 'ern-util'
import utils from '../../../lib/utils'

exports.command = 'use <alias>'
exports.desc = 'Select a Cauldron repository to use'

exports.builder = function (yargs: any) {
  return yargs.epilog(utils.epilog(exports))
}

exports.handler = function ({
  alias
} : {
  alias: string
}) {
  try {
    let cauldronRepositories = ernConfig.getValue('cauldronRepositories')
    if (!cauldronRepositories) {
      return console.log('No Cauldron repositories have been added yet')
    }
    if (!cauldronRepositories[alias]) {
      return console.log(`No Cauldron repository exists with ${alias} alias`)
    }
    ernConfig.setValue('cauldronRepoInUse', alias)
    shell.rm('-rf', `${Platform.rootDirectory}/cauldron`)
    console.log(`${alias} Cauldron is now in use`)
  } catch (e) {
    Utils.logErrorAndExitProcess(e)
  }
}
