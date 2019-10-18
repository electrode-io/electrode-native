// TO BE REMOVED IN 0.41.0
import { log, MiniApp } from 'ern-core'
import { epilog, tryCatchWrap } from '../lib'
import { Argv } from 'yargs'

export const command = 'unlink'
export const desc = 'Unlink a MiniApp'

export const builder = (argv: Argv) => {
  return argv.epilog(epilog(exports))
}

export const commandHandler = async () => {
  log.warn(`This command has been deprecated and will be removed in 0.41.0 release.
Please consider using 'ern link rm' command instead.`)
  MiniApp.fromCurrentPath().unlink()
}

export const handler = tryCatchWrap(commandHandler)
