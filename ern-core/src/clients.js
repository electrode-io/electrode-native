// @flow

import {
  CodePushCli,
  ReactNativeCli,
  YarnCli
} from 'ern-util'
import path from 'path'
import Platform from './Platform'

export const yarn = new YarnCli(getBinaryPath('yarn'))
export const reactnative = new ReactNativeCli(getBinaryPath('react-native'))
export const codepush = new CodePushCli(getBinaryPath('code-push'))

function getBinaryPath (binaryName: string) : string {
  return path.join(Platform.currentPlatformVersionPath, 'node_modules', '.bin', binaryName)
}
