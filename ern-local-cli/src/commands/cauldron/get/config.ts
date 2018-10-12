import { NativeApplicationDescriptor, utils as coreUtils } from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import { epilog, tryCatchWrap } from '../../../lib'
import { Argv } from 'yargs'

export const command = 'config <descriptor>'
export const desc = 'Get configuration from the cauldron'

export const builder = (argv: Argv) => {
  return argv
    .coerce('descriptor', NativeApplicationDescriptor.fromString)
    .epilog(epilog(exports))
}

export const commandHandler = async ({
  descriptor,
}: {
  descriptor: NativeApplicationDescriptor
}) => {
  const cauldron = await getActiveCauldron()
  const config = await cauldron.getConfig(descriptor)
  console.log(JSON.stringify(config, null, 2))
}

export const handler = tryCatchWrap(commandHandler)
