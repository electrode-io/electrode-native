import { log, MiniApp } from 'ern-core'
import { epilog, tryCatchWrap } from '../lib'
import { Argv } from 'yargs'

export const command = 'link'
export const desc = 'Link a MiniApp'

export const builder = (argv: Argv) => {
  return argv
    .commandDir('link', {
      extensions: process.env.ERN_ENV === 'development' ? ['js', 'ts'] : ['js'],
    })
    .epilog(epilog(exports))
}

// COMMAND TO BE REMOVED IN 0.41.0
export const commandHandler = async () => {
  log.warn(`This command has been deprecated and will be removed in 0.41.0 release.
Please consider using 'ern link add' command instead.`)
  await MiniApp.fromCurrentPath().link()
}

export const handler = tryCatchWrap(commandHandler)
