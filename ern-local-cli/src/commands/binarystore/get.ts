import {
  NativeApplicationDescriptor,
  shell,
  ErnBinaryStore,
  log,
} from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import utils from '../../lib/utils'
import fs from 'fs'
import path from 'path'
import { Argv } from 'yargs'

export const command = 'get <descriptor> <outDir>'
export const desc = 'Get a mobile application binary from the binary store'

export const builder = (argv: Argv) => {
  return argv.epilog(utils.epilog(exports))
}

export const handler = async ({
  descriptor,
  outDir,
}: {
  descriptor: string
  outDir: string
}) => {
  await utils.logErrorAndExitIfNotSatisfied({
    cauldronIsActive: {
      extraErrorMessage:
        'A Cauldron must be active in order to use this command',
    },
    isCompleteNapDescriptorString: {
      descriptor,
    },
    napDescriptorExistInCauldron: {
      descriptor,
      extraErrorMessage:
        'Cannot add binary of a non existing native application version',
    },
  })

  const napDescriptor = NativeApplicationDescriptor.fromString(descriptor)

  const cauldron = await getActiveCauldron()
  const binaryStoreConfig = await cauldron.getBinaryStoreConfig()
  if (!binaryStoreConfig) {
    return log.error('No binaryStore configuration was found in Cauldron')
  }

  try {
    const binaryStore = new ErnBinaryStore(binaryStoreConfig)
    if (!(await binaryStore.hasBinary(napDescriptor))) {
      return log.error(
        `No binary was found in the store for ${napDescriptor.toString()}`
      )
    }
    const absoluteOutDirPath = path.resolve(outDir)
    if (!fs.existsSync(absoluteOutDirPath)) {
      shell.mkdir('-p', absoluteOutDirPath)
    }
    const pathToBinary = await binaryStore.getBinary(napDescriptor, { outDir })
    log.info(`Binary was successfuly retrieved. Path: ${pathToBinary}`)
  } catch (e) {
    log.error(
      `An error occurred while retrieving ${napDescriptor.toString()} binary`
    )
  }
}
