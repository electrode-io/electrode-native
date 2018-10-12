import { utils as coreUtils, log } from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import { epilog, logErrorAndExitIfNotSatisfied } from '../../../lib'
import { Argv } from 'yargs'

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
      isFilePath: { p: localFilePath },
    })

    const cauldron = await getActiveCauldron()
    await cauldron.addFile({
      cauldronFilePath,
      localFilePath,
    })
    log.info(`${localFilePath} file successfully added to the Cauldron`)
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}
