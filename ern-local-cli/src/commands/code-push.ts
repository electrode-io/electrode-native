import { Argv } from 'yargs'

export const command = 'code-push'
export const desc = 'code-push commands'
export const builder = (argv: Argv) => {
  return argv
    .commandDir('code-push', {
      extensions:
        process.env.NODE_ENV === 'development' ? ['js', 'ts'] : ['js'],
    })
    .demandCommand(1, 'code-push needs a command')
    .strict()
}
export const handler = (argv: any) => {
  return
}
