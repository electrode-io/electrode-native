// @flow

import {
  Platform,
  config as ernConfig,
  shell,
  utils as coreUtils
} from 'ern-core'
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
    shell.rm('-rf', Platform.cauldronDirectory)
    log.info(`Done.`)
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}
