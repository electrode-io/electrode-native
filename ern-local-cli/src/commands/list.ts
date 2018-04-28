import { Argv } from 'yargs'

export const command = 'list'
export const desc = 'List information associated to an Electrode Native module'
export const builder = (argv: Argv) => {
  return argv
    .commandDir('list', {
      extensions:
        process.env.NODE_ENV === 'development' ? ['js', 'ts'] : ['js'],
    })
    .demandCommand(1, 'list needs a command')
    .strict()
}
export const handler = (args: any) => {
  return
}
