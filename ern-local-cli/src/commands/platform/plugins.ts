import { Argv } from 'yargs'

export const command = 'plugins'
export const desc = 'Plugins access commands'
export const builder = (argv: Argv) => {
  return argv.commandDir('plugins').demandCommand(1, 'plugins needs a command')
}
export const handler = (args: any) => {
  return
}
