import { MiniApp } from 'ern-core'
import { epilog, tryCatchWrap } from '../lib'
import { Argv } from 'yargs'

export const command = 'unlink'
export const desc = 'Unlink a MiniApp'

export const builder = (argv: Argv) => {
  return argv.epilog(epilog(exports))
}

export const commandHandler = async () => {
  MiniApp.fromCurrentPath().unlink()
}

export const handler = tryCatchWrap(commandHandler)
