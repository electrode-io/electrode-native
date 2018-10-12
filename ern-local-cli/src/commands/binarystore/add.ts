import { NativeApplicationDescriptor, log, utils as coreUtils } from 'ern-core'
import { epilog, logErrorAndExitIfNotSatisfied } from '../../lib'
import { getBinaryStoreFromCauldron } from 'ern-orchestrator'
import { Argv } from 'yargs'

export const command = 'add <descriptor> <pathToBinary>'
export const desc = 'Add a mobile application binary to the binary store'

export const builder = (argv: Argv) => {
  return argv
    .coerce('descriptor', d =>
      NativeApplicationDescriptor.fromString(d, { throwIfNotComplete: true })
    )
    .normalize('pathToBinary')
    .epilog(epilog(exports))
}

export const handler = async ({
  descriptor,
  pathToBinary,
}: {
  descriptor: NativeApplicationDescriptor
  pathToBinary: string
}) => {
  try {
    await logErrorAndExitIfNotSatisfied({
      isFilePath: { p: pathToBinary },
      napDescriptorExistInCauldron: { descriptor },
    })

    const binaryStore = await getBinaryStoreFromCauldron()
    await binaryStore.addBinary(descriptor, pathToBinary)
    log.info(`Binary was successfuly added to the store for ${descriptor}`)
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}
