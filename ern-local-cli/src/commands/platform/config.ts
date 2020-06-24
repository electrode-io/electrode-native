import { Argv } from 'yargs';

export const command = 'config';
export const desc = 'Manage ern platform configuration';
export const builder = (argv: Argv) => {
  return argv
    .commandDir('config', {
      extensions: process.env.ERN_ENV === 'development' ? ['js', 'ts'] : ['js'],
    })
    .demandCommand(1, 'config needs a command')
    .strict();
};
export const handler = (args: any) => {
  return;
};
