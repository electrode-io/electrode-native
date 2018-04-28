import { Argv } from 'yargs'

export const command = 'cauldron'
export const desc = 'Cauldron access commands'
export const builder = (argv: Argv) => {
  return argv
    .commandDir('cauldron', {
      extensions:
        process.env.NODE_ENV === 'development' ? ['js', 'ts'] : ['js'],
    })
    .demandCommand(1, 'cauldron needs a command')
    .strict()
}
export const handler = (args: any) => {
  return
}
