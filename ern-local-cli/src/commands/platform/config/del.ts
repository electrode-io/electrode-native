import { Argv } from 'yargs'
import { epilog, logErrorAndExitIfNotSatisfied } from '../../../lib'
import { config as ernConfig, log } from 'ern-core'

export const command = 'del <key>'
export const desc = 'Deletes the key from configuration file'

export const builder = (argv: Argv) => {
  return argv.epilog(epilog(exports))
}

export const handler = async ({ key }: { key: string }) => {
  await logErrorAndExitIfNotSatisfied({
    isValidPlatformConfig: {
      key,
    },
  })

  if (ernConfig.deleteConfig(key)) {
    log.info(`Configuration for ${key} is deleted`)
  } else {
    log.warn(`Configuration entry for ${key} not found`)
  }
}
