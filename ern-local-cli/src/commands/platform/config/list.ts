import { Argv } from 'yargs'
import utils from '../../../lib/utils'

export const command = 'list'
export const desc = 'Show all the config settings'

export const builder = (argv: Argv) => {
  return argv.epilog(utils.epilog(exports))
}

export const handler = async () => {
  return true
}
