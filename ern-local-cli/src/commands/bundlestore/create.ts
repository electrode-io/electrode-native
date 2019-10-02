import { getActiveCauldron } from 'ern-cauldron-api'
import { AppVersionDescriptor, BundleStoreSdk, log, config } from 'ern-core'
import { epilog, logErrorAndExitIfNotSatisfied, tryCatchWrap } from '../../lib'
import { Argv } from 'yargs'
import untildify from 'untildify'

export const command = 'create <store>'
export const desc = 'Create a new store'

export const builder = (argv: Argv) => {
  return argv
    .coerce('descriptor', d => AppVersionDescriptor.fromString(d))
    .coerce('pathToBinary', p => untildify(p))
    .epilog(epilog(exports))
}

export const commandHandler = async ({ store }: { store: string }) => {
  await logErrorAndExitIfNotSatisfied({
    bundleStoreUrlSetInCauldron: {
      extraErrorMessage: `You should add bundleStore config in your Cauldron`,
    },
  })

  const cauldron = await getActiveCauldron()
  const bundleStoreUrl = (await cauldron.getBundleStoreConfig()).url
  const sdk = new BundleStoreSdk(bundleStoreUrl)
  const accessKey = await sdk.createStore({ store })

  config.setValue('bundlestore-id', store)
  config.setValue('bundlestore-accesskey', accessKey)

  log.info(`Store ${store} was successfuly created`)
  log.info(`AccessKey : ${accessKey}`)
}

export const handler = tryCatchWrap(commandHandler)
