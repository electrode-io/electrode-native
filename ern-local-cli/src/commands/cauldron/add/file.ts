import { utils as coreUtils, log } from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import { epilog, logErrorAndExitIfNotSatisfied } from '../../../lib'
import { Argv } from 'yargs'
import fs from 'fs'

export const command = 'file <localFilePath> <cauldronFilePath>'
export const desc = 'Add a file in the Cauldron'

export const builder = (argv: Argv) => argv.epilog(epilog(exports))

export const handler = async ({
  cauldronFilePath,
  localFilePath,
}: {
  cauldronFilePath: string
  localFilePath: string
}) => {
  try {
    await logErrorAndExitIfNotSatisfied({
      cauldronIsActive: {
        extraErrorMessage:
          'A Cauldron must be active in order to use this command',
      },
    })

    if (!fs.existsSync(localFilePath)) {
      throw new Error(`File ${localFilePath} does not exist`)
    }

    const cauldron = await getActiveCauldron()
    await cauldron.addFile({
      cauldronFilePath,
      localFilePath,
    })
    log.info(`${localFilePath} file was successfully added !`)
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}
