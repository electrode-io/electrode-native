import { MiniApp } from 'ern-core'
import { epilog, tryCatchWrap } from '../../lib'
import { Argv } from 'yargs'

export const command = 'rm'
export const desc = 'Remove a MiniApp link'

export const builder = (argv: Argv) => {
  return argv.epilog(epilog(exports))
}

export const commandHandler = async () => {
  MiniApp.fromCurrentPath().unlink()
}

export const handler = tryCatchWrap(commandHandler)
