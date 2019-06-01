import { AppVersionDescriptor, log } from 'ern-core'
import { getBinaryStoreFromCauldron } from 'ern-orchestrator'
import { epilog, logErrorAndExitIfNotSatisfied, tryCatchWrap } from '../../lib'
import { Argv } from 'yargs'

export const command = 'remove <descriptor>'
export const desc = 'Remove a mobile application binary from the binary store'

export const builder = (argv: Argv) => {
  return argv
    .coerce('descriptor', d => AppVersionDescriptor.fromString(d))
    .epilog(epilog(exports))
}

export const commandHandler = async ({
  descriptor,
}: {
  descriptor: AppVersionDescriptor
}) => {
  await logErrorAndExitIfNotSatisfied({
    napDescriptorExistInCauldron: { descriptor },
  })

  const binaryStore = await getBinaryStoreFromCauldron()
  await binaryStore.removeBinary(descriptor)
  log.info(`${descriptor} binary was successfuly removed from the store`)
}

export const handler = tryCatchWrap(commandHandler)
