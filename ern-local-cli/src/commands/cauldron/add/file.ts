import { log } from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import {
  epilog,
  logErrorAndExitIfNotSatisfied,
  tryCatchWrap,
} from '../../../lib'
import { Argv } from 'yargs'
import untildify from 'untildify'

export const command = 'file <localFilePath> <cauldronFilePath>'
export const desc = 'Add a file in the Cauldron'

export const builder = (argv: Argv) =>
  argv.coerce('localFilePath', p => untildify(p)).epilog(epilog(exports))

export const commandHandler = async ({
  cauldronFilePath,
  localFilePath,
}: {
  cauldronFilePath: string
  localFilePath: string
}) => {
  await logErrorAndExitIfNotSatisfied({
    isFilePath: { p: localFilePath },
  })

  const cauldron = await getActiveCauldron()
  await cauldron.addFile({
    cauldronFilePath,
    localFilePath,
  })
  log.info(`${localFilePath} file successfully added to the Cauldron`)
}

export const handler = tryCatchWrap(commandHandler)
