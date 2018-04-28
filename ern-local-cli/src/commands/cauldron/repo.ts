import { Argv } from 'yargs'

export const command = 'repo'
export const desc = 'Manage Cauldron git repository(ies)'
export const builder = (argv: Argv) => {
  return argv
    .commandDir('repo', {
      extensions:
        process.env.NODE_ENV === 'development' ? ['js', 'ts'] : ['js'],
    })
    .demandCommand(1, 'repo needs a command')
    .strict()
}
export const handler = (args: any) => {
  return
}
