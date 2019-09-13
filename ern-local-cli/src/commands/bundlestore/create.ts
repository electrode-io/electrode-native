import { AppVersionDescriptor, BundleStoreSdk, log, config } from 'ern-core'
import { epilog, logErrorAndExitIfNotSatisfied, tryCatchWrap } from '../../lib'
import { Argv } from 'yargs'

export const command = 'create <store>'
export const desc = 'Create a new store'

export const builder = (argv: Argv) => {
  return argv
    .coerce('descriptor', d => AppVersionDescriptor.fromString(d))
    .normalize('pathToBinary')
    .epilog(epilog(exports))
}

export const commandHandler = async ({ store }: { store: string }) => {
  await logErrorAndExitIfNotSatisfied({
    bundleStoreHostIsSet: {
      extraErrorMessage: `You can use 'ern platform config set bundlestore-host <host>' to set the bundle store server host`,
    },
  })

  const sdk = new BundleStoreSdk(config.getValue('bundlestore-host'))
  const accessKey = await sdk.createStore({ store })

  config.setValue('bundlestore-id', store)
  config.setValue('bundlestore-accesskey', accessKey)

  log.info(`Store ${store} was successfuly created`)
  log.info(`AccessKey : ${accessKey}`)
}

export const handler = tryCatchWrap(commandHandler)
