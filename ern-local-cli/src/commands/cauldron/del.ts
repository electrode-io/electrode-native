import { Argv } from 'yargs'

export const command = 'del'
export const desc = 'Remove objects from the Cauldron'
export const builder = (argv: Argv) => {
  return argv
    .commandDir('del', {
      extensions:
        process.env.NODE_ENV === 'development' ? ['js', 'ts'] : ['js'],
    })
    .demandCommand(1, 'add needs a command')
    .strict()
}
export const handler = (args: any) => {
  return
}
