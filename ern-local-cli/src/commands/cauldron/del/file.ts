import { utils as coreUtils, log } from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import { epilog, logErrorAndExitIfNotSatisfied } from '../../../lib'
import { Argv } from 'yargs'

export const command = 'file <cauldronFilePath>'
export const desc = 'Remove a file from the Cauldron'

export const builder = (argv: Argv) => argv.epilog(epilog(exports))

export const handler = async ({
  cauldronFilePath,
}: {
  cauldronFilePath: string
}) => {
  try {
    await logErrorAndExitIfNotSatisfied({
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
