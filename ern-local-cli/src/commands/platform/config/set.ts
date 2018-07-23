import { config as ernConfig, utils as coreUtils, log } from 'ern-core'
import utils, { platformSupportedConfigAsString } from '../../../lib/utils'
import { Argv } from 'yargs'

export const command = 'set <key> [value]'
export const desc = 'Sets the key to the value in the configuration file'

export const builder = (argv: Argv) => {
  return argv.epilog(platformSupportedConfigAsString() + utils.epilog(exports))
}

export const handler = async ({
  key,
  value,
}: {
  key: string
  value?: string
}) => {
  if (!value) {
    coreUtils.logErrorAndExitProcess(new Error(`Pass value for ${key}`))
  }
  await utils.logErrorAndExitIfNotSatisfied({
    isValidPlatformConfig: {
      key,
    },
  })
  try {
    let valueToset: any = value
    if (!isNaN(+value!)) {
      valueToset = +value!
    } else {
      valueToset = value === 'true' ? true : value === 'false' ? false : value
    }
    ernConfig.setValue(key, valueToset)
    log.info(`${key} set to ${ernConfig.getValue(key)}`)
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}
