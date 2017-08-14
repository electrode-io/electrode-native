// @flow

import {
  exec
} from './exec'
import fs from 'fs'
import path from 'path'

export default class ReactNativeCli {
  _binaryPath: ?string

  constructor (binaryPath?: string) {
    this._binaryPath = binaryPath
  }

  get binaryPath () : string {
    return this._binaryPath ? this._binaryPath : `react-native`
  }

  async init (appName: string, rnVersion: string) {
    return new Promise((resolve, reject) => {
      const dir = path.join(process.cwd(), appName)

      if (fs.existsSync(dir)) {
        return reject(new Error(`Path already exists will not override ${dir}`))
      }

      exec(`${this.binaryPath} init ${appName} --version react-native@${rnVersion} --skip-jest`,
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
      exec(`${this.binaryPath} bundle \
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
