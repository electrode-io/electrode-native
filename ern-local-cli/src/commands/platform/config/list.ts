import { Argv } from 'yargs'
import utils, { platformSupportedConfigAsString } from '../../../lib/utils'
import { config as ernConfig, log } from 'ern-core'

export const command = 'list'
export const desc = 'Show all the config settings'

export const builder = (argv: Argv) => {
  return argv.epilog(utils.epilog(exports))
}

export const handler = async () => {
  // TODO: Add tabular view
  log.info(JSON.stringify(ernConfig.getAllConfig(), null, 2))
}
