import { MiniApp } from 'ern-core'
import { epilog, tryCatchWrap } from '../../lib'
import { Argv } from 'yargs'

export const command = 'add'
export const desc = 'Add a MiniApp link'

export const builder = (argv: Argv) => {
  return argv.epilog(epilog(exports))
}
export const commandHandler = async () => {
  await MiniApp.fromCurrentPath().link()
}

export const handler = tryCatchWrap(commandHandler)
