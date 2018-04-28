import { utils as coreUtils, log } from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import { Argv } from 'yargs'

export const command = 'upgrade'
export const desc = 'Upgrade the Cauldron schema'
export const builder = (argv: Argv) => {
  return
}
export const handler = async () => {
  try {
    const cauldron = await getActiveCauldron({
      ignoreSchemaVersionMismatch: true,
    })
    if (!cauldron) {
      throw new Error('A Cauldron must be active in order to use this command')
    }
    await cauldron.upgradeCauldronSchema()
    log.debug('Cauldron was succesfully upgraded !')
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}
