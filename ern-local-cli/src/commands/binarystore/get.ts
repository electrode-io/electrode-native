import { AppVersionDescriptor, kax, log } from 'ern-core'
import { getBinaryStoreFromCauldron } from 'ern-orchestrator'
import { epilog, logErrorAndExitIfNotSatisfied, tryCatchWrap } from '../../lib'
import { Argv } from 'yargs'
import untildify from 'untildify'

export const command = 'get <descriptor> <outDir>'
export const desc = 'Get a mobile application binary from the binary store'

export const builder = (argv: Argv) => {
  return argv
    .coerce('descriptor', d => AppVersionDescriptor.fromString(d))
    .option('flavor', {
      describe: 'Custom flavor of this binary',
      type: 'string',
    })
    .coerce('outDir', p => untildify(p))
    .epilog(epilog(exports))
}

export const commandHandler = async ({
  descriptor,
  flavor,
  outDir,
}: {
  descriptor: AppVersionDescriptor
  flavor?: string
  outDir: string
}) => {
  await logErrorAndExitIfNotSatisfied({
    napDescriptorExistInCauldron: { descriptor },
  })

  const binaryStore = await getBinaryStoreFromCauldron()
  const pathToBinary = await kax.task('Downloading binary from store').run(
    binaryStore.getBinary(descriptor, {
      flavor,
      outDir,
    })
  )
  log.info(
    `${descriptor} binary ${
      flavor ? `[flavor: ${flavor}]` : ''
    } was successfuly downloaded from the store [path: ${pathToBinary}]`
  )
}

export const handler = tryCatchWrap(commandHandler)
