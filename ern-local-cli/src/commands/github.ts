import { Argv } from 'yargs';

export const command = 'github';
export const desc = 'Helper commands for GitHub based MiniApps';
export const builder = (argv: Argv) => {
  return argv
    .commandDir('github', {
      extensions: process.env.ERN_ENV === 'development' ? ['js', 'ts'] : ['js'],
    })
    .demandCommand(1, 'github needs a command')
    .strict();
};
export const handler = (args: any) => {
  return;
};
