import { Argv } from 'yargs';

export const command = 'config';
export const desc = 'Manage configuration stored in Cauldron';
export const builder = (argv: Argv) => {
  return argv
    .commandDir('config', {
      extensions: process.env.ERN_ENV === 'development' ? ['js', 'ts'] : ['js'],
    })
    .demandCommand(1, 'Need a command')
    .strict();
};
export const handler = (args: any) => {
  return;
};
