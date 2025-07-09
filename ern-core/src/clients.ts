import ReactNativeCli from './ReactNativeCli';
import { YarnCli } from './YarnCli';
import fs from 'fs';
import path from 'path';

export const yarn = new YarnCli(getInternalBinaryPath('yarn'));
export const reactnative = new ReactNativeCli(getInternalBinaryPath('rnc-cli'));

function getInternalBinaryPath(binaryName: string): string {
  const pathWhenInstalledWithYarn = path.resolve(
    __dirname,
    '../node_modules/.bin',
    binaryName,
  );
  const pathWhenInstalledWithNpm = path.resolve(
    __dirname,
    '../../.bin',
    binaryName,
  );
  if (fs.existsSync(pathWhenInstalledWithYarn)) {
    return pathWhenInstalledWithYarn;
  } else if (fs.existsSync(pathWhenInstalledWithNpm)) {
    return pathWhenInstalledWithNpm;
  }
  throw new Error(
    `Could not find ${binaryName} in ${pathWhenInstalledWithYarn} nor in ${pathWhenInstalledWithNpm}`,
  );
}
