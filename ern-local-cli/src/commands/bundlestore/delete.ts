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
    bundleStoreHostIsSet: {
      extraErrorMessage: `You can use 'ern platform config set bundlestore-host <host>' to set the bundle store server host`,
    },
  })

  const sdk = new BundleStoreSdk(config.getValue('bundlestore-host'))

  const storeId = await sdk.deleteStoreByAccessKey({ accessKey })

  if (storeId === config.getValue('bundlestore-id')) {
    config.setValue('bundlestore-id', undefined)
    config.setValue('bundlestore-accesskey', undefined)
  }

  log.info(`Deleted store ${storeId}`)
}

export const handler = tryCatchWrap(commandHandler)
