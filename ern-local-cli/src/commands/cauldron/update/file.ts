import { utils as coreUtils, log } from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import utils from '../../../lib/utils'
import { Argv } from 'yargs'
import fs from 'fs'

export const command = 'file <localFilePath> <cauldronFilePath>'
export const desc = 'Update a file in the Cauldron'

export const builder = (argv: Argv) => argv

export const handler = async ({
  localFilePath,
  cauldronFilePath,
}: {
  localFilePath: string
  cauldronFilePath: string
}) => {
  try {
    await utils.logErrorAndExitIfNotSatisfied({
      cauldronIsActive: {
        extraErrorMessage:
          'A Cauldron must be active in order to use this command',
      },
    })

    if (!fs.existsSync(localFilePath)) {
      throw new Error(`File ${localFilePath} does not exist`)
    }

    const cauldron = await getActiveCauldron()
    await cauldron.updateFile({
      cauldronFilePath,
      localFilePath,
    })
    log.info(`${localFilePath} file was successfully updated !`)
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}
