import { MiniApp } from 'ern-core'
import { epilog, tryCatchWrap } from '../lib'
import { Argv } from 'yargs'

export const command = 'link'
export const desc = 'Link a MiniApp'

export const builder = (argv: Argv) => {
  return argv.epilog(epilog(exports))
}

export const commandHandler = async () => {
  await MiniApp.fromCurrentPath().link()
}

export const handler = tryCatchWrap(commandHandler)
