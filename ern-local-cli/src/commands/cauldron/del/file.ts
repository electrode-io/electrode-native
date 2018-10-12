import { utils as coreUtils, log } from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import { epilog } from '../../../lib'
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
    const cauldron = await getActiveCauldron()
    await cauldron.removeFile({ cauldronFilePath })
    log.info(`${cauldronFilePath} file successfully removed from the Cauldron`)
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}
