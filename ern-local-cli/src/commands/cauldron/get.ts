import { Argv } from 'yargs'

export const command = 'get'
export const desc = 'Get objects from the Cauldron'
export const builder = (argv: Argv) => {
  return argv
    .commandDir('get', {
      extensions:
        process.env.NODE_ENV === 'development' ? ['js', 'ts'] : ['js'],
    })
    .demandCommand(1, 'add needs a command')
    .strict()
}
export const handler = (args: any) => {
  return
}
