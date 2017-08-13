// @flow

import {
  ReactNativeCli,
  YarnCli
} from 'ern-util'
import path from 'path'
import Platform from './Platform'

export const yarn = new YarnCli(getBinaryPath('yarn'))
export const reactnative = new ReactNativeCli(getBinaryPath('react-native'))

function getBinaryPath (binaryName: string) : string {
  return path.join(Platform.currentPlatformVersionPath, 'node_modules', '.bin', binaryName)
}
