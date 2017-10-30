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

exports.command = 'clear'
exports.desc = 'Do not use any Cauldron'

exports.builder = function (yargs: any) {
  return yargs.epilog(utils.epilog(exports))
}

exports.handler = function ({
  alias
} : {
  alias: string
}) {
  try {
    ernConfig.setValue('cauldronRepoInUse', undefined)
    shell.rm('-rf', `${Platform.rootDirectory}/cauldron`)
    log.info(`Done.`)
  } catch (e) {
    Utils.logErrorAndExitProcess(e)
  }
}
