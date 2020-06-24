import { Argv } from 'yargs';

export const command = 'bundlestore';
export const desc = 'Bundle store commands';
export const builder = (argv: Argv) => {
  return argv
    .commandDir('bundlestore', {
      extensions: process.env.ERN_ENV === 'development' ? ['js', 'ts'] : ['js'],
    })
    .demandCommand(1, 'bundlestore needs a command')
    .strict();
};
export const handler = (args: any) => {
  return;
};
