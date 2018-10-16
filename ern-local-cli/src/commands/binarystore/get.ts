import { NativeApplicationDescriptor, log } from 'ern-core'
import { getBinaryStoreFromCauldron } from 'ern-orchestrator'
import { epilog, logErrorAndExitIfNotSatisfied, tryCatchWrap } from '../../lib'
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

export const commandHandler = async ({
  descriptor,
  outDir,
}: {
  descriptor: NativeApplicationDescriptor
  outDir: string
}) => {
  await logErrorAndExitIfNotSatisfied({
    napDescriptorExistInCauldron: { descriptor },
  })

  const binaryStore = await getBinaryStoreFromCauldron()
  const pathToBinary = await binaryStore.getBinary(descriptor, { outDir })
  log.info(`Binary was successfuly downloaded in ${pathToBinary}`)
}

export const handler = tryCatchWrap(commandHandler)
