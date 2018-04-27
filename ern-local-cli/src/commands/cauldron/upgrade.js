// @flow

import {
  utils as coreUtils
} from 'ern-core'
import {
  getActiveCauldron
} from 'ern-cauldron-api'

exports.command = 'upgrade'
exports.desc = 'Upgrade the Cauldron schema'
exports.builder = function (yargs: any) {}
exports.handler = async function () {
  try {
    const cauldron = await getActiveCauldron({ignoreSchemaVersionMismatch: true})
    if (!cauldron) {
      throw new Error('A Cauldron must be active in order to use this command')
    }
    await cauldron.upgradeCauldronSchema()
    log.debug('Cauldron was succesfully upgraded !')
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}
