import { utils as coreUtils, log } from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import utils from '../../../lib/utils'
import { Argv } from 'yargs'
import fs from 'fs'

export const command = 'file <cauldronFilePath>'
export const desc = 'Remove a file from the Cauldron'

export const builder = (argv: Argv) => argv

export const handler = async ({
  cauldronFilePath,
}: {
  cauldronFilePath: string
}) => {
  try {
    await utils.logErrorAndExitIfNotSatisfied({
      cauldronIsActive: {
        extraErrorMessage:
          'A Cauldron must be active in order to use this command',
      },
    })

    const cauldron = await getActiveCauldron()
    await cauldron.removeFile({
      cauldronFilePath,
    })
    log.info(`${cauldronFilePath} file was successfully removed !`)
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}
