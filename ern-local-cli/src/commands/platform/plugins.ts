import { Argv } from 'yargs';

export const command = 'plugins';
export const desc = 'Plugins access commands';
export const builder = (argv: Argv) => {
  return argv
    .commandDir('plugins', {
      extensions: process.env.ERN_ENV === 'development' ? ['js', 'ts'] : ['js'],
    })
    .demandCommand(1, 'plugins needs a command');
};
export const handler = (args: any) => {
  return;
};
