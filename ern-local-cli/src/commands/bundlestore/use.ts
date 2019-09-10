import { AppVersionDescriptor, BundleStoreSdk, log, config } from 'ern-core'
import { epilog, logErrorAndExitIfNotSatisfied, tryCatchWrap } from '../../lib'
import { Argv } from 'yargs'

export const command = 'use <accessKey>'
export const desc = 'Use an existing store given its access key'

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

  const store = await sdk.getStoreByAccessKey({ accessKey })
  config.setValue('bundlestore-id', store)
  config.setValue('bundlestore-accesskey', accessKey)

  log.info(`Now using store ${store}`)
}

export const handler = tryCatchWrap(commandHandler)
