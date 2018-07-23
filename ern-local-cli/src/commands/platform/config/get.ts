import { Argv } from 'yargs'
import utils from '../../../lib/utils'

export const command = 'get <key>'
export const desc = 'Echo the config value to stdout'

export const builder = (argv: Argv) => {
  return argv.epilog(utils.epilog(exports))
}

export const handler = async () => {
  return true
}
