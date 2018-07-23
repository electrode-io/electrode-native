import { Argv } from 'yargs'
import utils from '../../../lib/utils'

export const command = 'delete <key>'
export const desc = 'Deletes the key from configuration file'

export const builder = (argv: Argv) => {
  return argv.epilog(utils.epilog(exports))
}

export const handler = async () => {
  return true
}
