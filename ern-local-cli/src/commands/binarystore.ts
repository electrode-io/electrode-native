import { Argv } from 'yargs'

export const command = 'binarystore'
export const desc = 'Binary store access commands'
export const builder = (argv: Argv) => {
  return argv
    .commandDir('binarystore')
    .demandCommand(1, 'binarystore needs a command')
    .strict()
}
export const handler = (args: any) => {
  return
}
