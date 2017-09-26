// @flow

import {
  CodePushCli,
  ReactNativeCli,
  YarnCli
} from 'ern-util'
import fs from 'fs'
import path from 'path'

export const yarn = new YarnCli(getBinaryPath('yarn'))
export const reactnative = new ReactNativeCli(getBinaryPath('react-native'))
export const codepush = new CodePushCli(getBinaryPath('code-push'))

function getBinaryPath (binaryName: string) : string {
  const pathWhenInstalledWithYarn = path.resolve(__dirname, '..', 'node_modules', '.bin', binaryName)
  const pathWhenInstalledWithNpm = path.resolve(__dirname, '..', '..', '.bin', binaryName)
  if (fs.statSync(pathWhenInstalledWithYarn)) {
    return pathWhenInstalledWithYarn
  } else if (fs.statSync(pathWhenInstalledWithNpm)) {
    return pathWhenInstalledWithNpm
  }
  throw new Error(`Could not find ${binaryName} in ${pathWhenInstalledWithYarn} nor in ${pathWhenInstalledWithNpm}`)
}
