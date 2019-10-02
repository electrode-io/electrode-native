import { log } from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import { epilog, tryCatchWrap } from '../../../lib'
import { Argv } from 'yargs'
import fs from 'fs'
import untildify from 'untildify'

export const command = 'file <localFilePath> <cauldronFilePath>'
export const desc = 'Update a file in the Cauldron'

export const builder = (argv: Argv) =>
  argv.coerce('localFilePath', p => untildify(p)).epilog(epilog(exports))

export const commandHandler = async ({
  cauldronFilePath,
  localFilePath,
}: {
  cauldronFilePath: string
  localFilePath: string
}) => {
  if (!fs.existsSync(localFilePath)) {
    throw new Error(`File ${localFilePath} does not exist`)
  }

  const cauldron = await getActiveCauldron()
  await cauldron.updateFile({
    cauldronFilePath,
    localFilePath,
  })
  log.info(`${cauldronFilePath} file successfully updated`)
}

export const handler = tryCatchWrap(commandHandler)
