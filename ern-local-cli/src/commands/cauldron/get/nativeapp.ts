import { NativeApplicationDescriptor, log } from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import { epilog, tryCatchWrap } from '../../../lib'
import { Argv } from 'yargs'

export const command = 'nativeapp [descriptor]'
export const desc = 'Get a native application from the cauldron'

export const builder = (argv: Argv) => {
  return argv
    .coerce('descriptor', NativeApplicationDescriptor.fromString)
    .epilog(epilog(exports))
}

export const commandHandler = async ({
  descriptor,
}: {
  descriptor?: NativeApplicationDescriptor
}) => {
  const cauldron = await getActiveCauldron()
  if (!descriptor) {
    const napDescriptors = await cauldron.getNapDescriptorStrings()
    napDescriptors.forEach(n => log.info(n))
  } else {
    const nativeApp = await cauldron.getDescriptor(descriptor)
    console.log(JSON.stringify(nativeApp, null, 1))
  }
}

export const handler = tryCatchWrap(commandHandler)
