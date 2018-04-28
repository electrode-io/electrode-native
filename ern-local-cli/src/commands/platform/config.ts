import { config as ernConfig, utils as coreUtils, log } from 'ern-core'
import utils from '../../lib/utils'
import { Argv } from 'yargs'

export const command = 'config <key> [value]'
export const desc = 'Get or set a configuration key'

export const builder = (argv: Argv) => {
  return argv.epilog(utils.epilog(exports))
}

export const handler = ({ key, value }: { key: string; value?: string }) => {
  try {
    if (value) {
      const valueToset =
        value === 'true' ? true : value === 'false' ? false : value

      ernConfig.setValue(key, valueToset)
      log.info(`${key} set to ${ernConfig.getValue(key)}`)
    } else {
      log.info(`${key}: ${ernConfig.getValue(key)}`)
    }
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}
