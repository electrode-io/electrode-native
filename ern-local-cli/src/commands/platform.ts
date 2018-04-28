import { Argv } from 'yargs'

export const command = 'platform'
export const desc = 'Platform related commands'
export const builder = (argv: Argv) => {
  return argv
    .commandDir('platform', {
      extensions:
        process.env.NODE_ENV === 'development' ? ['js', 'ts'] : ['js'],
    })
    .demandCommand(1, 'platform needs a command')
    .strict()
}
