import { getActiveCauldron } from 'ern-cauldron-api'
import { AppVersionDescriptor, BundleStoreSdk, log, config } from 'ern-core'
import { epilog, logErrorAndExitIfNotSatisfied, tryCatchWrap } from '../../lib'
import { Argv } from 'yargs'

export const command = 'delete <accessKey>'
export const desc = 'Delete a store given its access key'

export const builder = (argv: Argv) => {
  return argv
    .coerce('descriptor', d => AppVersionDescriptor.fromString(d))
    .normalize('pathToBinary')
    .epilog(epilog(exports))
}

export const commandHandler = async ({ accessKey }: { accessKey: string }) => {
  await logErrorAndExitIfNotSatisfied({
    bundleStoreUrlSetInCauldron: {
      extraErrorMessage: `You should add bundleStore config in your Cauldron`,
    },
  })

  const cauldron = await getActiveCauldron()
  const bundleStoreUrl = (await cauldron.getBundleStoreConfig()).url
  const sdk = new BundleStoreSdk(bundleStoreUrl)

  const storeId = await sdk.deleteStoreByAccessKey({ accessKey })

  if (storeId === config.getValue('bundlestore-id')) {
    config.setValue('bundlestore-id', undefined)
    config.setValue('bundlestore-accesskey', undefined)
  }

  log.info(`Deleted store ${storeId}`)
}

export const handler = tryCatchWrap(commandHandler)
