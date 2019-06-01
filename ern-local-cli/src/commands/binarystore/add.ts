import { AppVersionDescriptor, log } from 'ern-core'
import { epilog, logErrorAndExitIfNotSatisfied, tryCatchWrap } from '../../lib'
import { getBinaryStoreFromCauldron } from 'ern-orchestrator'
import { Argv } from 'yargs'

export const command = 'add <descriptor> <pathToBinary>'
export const desc = 'Add a mobile application binary to the binary store'

export const builder = (argv: Argv) => {
  return argv
    .coerce('descriptor', d => AppVersionDescriptor.fromString(d))
    .normalize('pathToBinary')
    .epilog(epilog(exports))
}

export const commandHandler = async ({
  descriptor,
  pathToBinary,
}: {
  descriptor: AppVersionDescriptor
  pathToBinary: string
}) => {
  await logErrorAndExitIfNotSatisfied({
    napDescriptorExistInCauldron: { descriptor },
    pathExist: { p: pathToBinary },
  })

  const binaryStore = await getBinaryStoreFromCauldron()
  await binaryStore.addBinary(descriptor, pathToBinary)
  log.info(`Binary was successfuly added to the store for ${descriptor}`)
}

export const handler = tryCatchWrap(commandHandler)
