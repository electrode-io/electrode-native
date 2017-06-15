// @flow

import {
  exec
} from './exec'
import fs from 'fs'
import path from 'path'

export default class ReactNativeCommands {
  _reactNativeBinaryPath: string

  constructor (reactNativeBinaryPath?: string) {
    if (reactNativeBinaryPath) {
      this._reactNativeBinaryPath = reactNativeBinaryPath
    } else {
      this._reactNativeBinaryPath = `react-native`
    }
  }

  async init (appName: string, rnVersion: string) {
    return new Promise((resolve, reject) => {
      const dir = path.join(process.cwd(), appName)

      if (fs.existsSync(dir)) {
        return reject(new Error(`Path already exists will not override ${dir}`))
      }

      exec(`${this._reactNativeBinaryPath} init ${appName} --version react-native@${rnVersion} --skip-jest`,
                (err, stdout, stderr) => {
                  if (err) {
                    return reject(err)
                  }
                  resolve(stdout)
                })
    })
  }

  async bundle ({
    entryFile,
    dev,
    bundleOutput,
    assetsDest,
    platform
  } : {
    entryFile: string,
    dev: boolean,
    bundleOutput: string,
    assetsDest: string,
    platform: 'android' | 'ios'
  }) {
    return new Promise((resolve, reject) => {
      exec(`${this._reactNativeBinaryPath} bundle \
        ${entryFile ? `--entry-file=${entryFile}` : ''} \
        ${dev ? '--dev=true' : '--dev=false'} \
        ${platform ? `--platform=${platform}` : ''} \
        ${bundleOutput ? `--bundle-output=${bundleOutput}` : ''} \
        ${assetsDest ? `--assets-dest=${assetsDest}` : ''}`,
                (err, stdout, stderr) => {
                  if (err) {
                    return reject(err)
                  }
                  if (stderr) {
                    return reject(stderr)
                  }
                  if (stdout) {
                    resolve(stdout)
                  }
                })
    })
  }
}
