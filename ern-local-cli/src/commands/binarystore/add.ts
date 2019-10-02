import { AppVersionDescriptor, kax, log } from 'ern-core'
import { epilog, logErrorAndExitIfNotSatisfied, tryCatchWrap } from '../../lib'
import { getBinaryStoreFromCauldron } from 'ern-orchestrator'
import { Argv } from 'yargs'
import untildify from 'untildify'

export const command = 'add <descriptor> <pathToBinary>'
export const desc = 'Add a mobile application binary to the binary store'

export const builder = (argv: Argv) => {
  return argv
    .coerce('descriptor', d => AppVersionDescriptor.fromString(d))
    .option('flavor', {
      describe: 'Custom flavor of this binary',
      type: 'string',
    })
    .coerce('pathToBinary', p => untildify(p))
    .epilog(epilog(exports))
}

export const commandHandler = async ({
  descriptor,
  flavor,
  pathToBinary,
}: {
  descriptor: AppVersionDescriptor
  flavor?: string
  pathToBinary: string
}) => {
  await logErrorAndExitIfNotSatisfied({
    napDescriptorExistInCauldron: { descriptor },
    pathExist: { p: pathToBinary },
  })

  const binaryStore = await getBinaryStoreFromCauldron()
  await kax
    .task('Uploading binary to store')
    .run(binaryStore.addBinary(descriptor, pathToBinary, { flavor }))
  log.info(
    `${descriptor} binary ${
      flavor ? `[flavor: ${flavor}]` : ''
    } was successfuly uploaded to the store`
  )
}

export const handler = tryCatchWrap(commandHandler)
