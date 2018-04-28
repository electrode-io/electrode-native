import { Argv } from 'yargs'

export const command = 'update'
export const desc = 'Update objects in the Cauldron'
export const builder = (argv: Argv) => {
  return argv
    .commandDir('update', {
      extensions:
        process.env.NODE_ENV === 'development' ? ['js', 'ts'] : ['js'],
    })
    .demandCommand(1, 'Need a command')
    .strict()
}
export const handler = (args: any) => {
  return
}
