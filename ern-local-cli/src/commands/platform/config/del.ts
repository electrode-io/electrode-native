import { Argv } from 'yargs'
import {
  epilog,
  logErrorAndExitIfNotSatisfied,
  tryCatchWrap,
} from '../../../lib'
import { config as ernConfig, log } from 'ern-core'

export const command = 'del <key>'
export const desc = 'Deletes the key from configuration file'

export const builder = (argv: Argv) => {
  return argv.epilog(epilog(exports))
}

export const commandHandler = async ({ key }: { key: string }) => {
  await logErrorAndExitIfNotSatisfied({
    isValidPlatformConfig: {
      key,
    },
  })

  if (ernConfig.del(key)) {
    log.info(`Successfully deleted ${key} from config`)
  } else {
    log.warn(`${key} was not found in config`)
  }
}

export const handler = tryCatchWrap(commandHandler)
