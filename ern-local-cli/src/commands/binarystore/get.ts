import {
  NativeApplicationDescriptor,
  shell,
  log,
  utils as coreUtils,
} from 'ern-core'
import { getBinaryStoreFromCauldron } from 'ern-orchestrator'
import { epilog, logErrorAndExitIfNotSatisfied } from '../../lib'
import fs from 'fs'
import { Argv } from 'yargs'

export const command = 'get <descriptor> <outDir>'
export const desc = 'Get a mobile application binary from the binary store'

export const builder = (argv: Argv) => {
  return argv
    .coerce('descriptor', d =>
      NativeApplicationDescriptor.fromString(d, { throwIfNotComplete: true })
    )
    .normalize('outDir')
    .epilog(epilog(exports))
}

export const handler = async ({
  descriptor,
  outDir,
}: {
  descriptor: NativeApplicationDescriptor
  outDir: string
}) => {
  try {
    await logErrorAndExitIfNotSatisfied({
      napDescriptorExistInCauldron: { descriptor },
    })

    if (!fs.existsSync(outDir)) {
      shell.mkdir('-p', outDir)
    }

    const binaryStore = await getBinaryStoreFromCauldron()
    const pathToBinary = await binaryStore.getBinary(descriptor, { outDir })
    log.info(`Binary was successfuly downloaded in ${pathToBinary}`)
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}
