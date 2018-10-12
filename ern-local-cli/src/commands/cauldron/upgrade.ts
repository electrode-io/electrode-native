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
    await cauldron.upgradeCauldronSchema()
    log.info('Cauldron was successfully upgraded')
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}
