import { Argv } from 'yargs'

export const command = 'add'
export const desc = 'Add objects to the Cauldron'
export const builder = (argv: Argv) => {
  return argv
    .commandDir('add', {
      extensions:
        process.env.NODE_ENV === 'development' ? ['js', 'ts'] : ['js'],
    })
    .demandCommand(1, 'add needs a command')
    .strict()
}
export const handler = (args: any) => {
  return
}
