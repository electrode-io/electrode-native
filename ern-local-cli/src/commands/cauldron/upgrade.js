// @flow

import {
  utils as coreUtils
} from 'ern-core'
import utils from '../../lib/utils'

exports.command = 'upgrade'
exports.desc = 'Upgrade the Cauldron schema'
exports.builder = function (yargs: any) {}
exports.handler = async function () {
  await utils.logErrorAndExitIfNotSatisfied({
    cauldronIsActive: {
      extraErrorMessage: 'A Cauldron must be active in order to use this command'
    }
  })
  try {
    const cauldron = await coreUtils.getCauldronInstance({ignoreSchemaVersionMismatch: true})
    await cauldron.upgradeCauldronSchema()
    log.debug(`Cauldron was succesfully upgraded !`)
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}
