// @flow

import {
  exec
} from './exec'
import {
  spawn
} from 'child_process'
import * as fileUtils from './fileUtil'
import fs from 'fs'
import path from 'path'
import shell from 'shelljs'
const fetch = require('node-fetch')

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
            reject(err)
          } else {
            resolve(stdout)
          }
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
              reject(err)
            } else if (stderr) {
              reject(stderr)
            } else if (stdout) {
              resolve(stdout)
            }
          })
    })
  }

  startPackager (cwd: string) {
    const packager = spawn(this.binaryPath, [ 'start' ], { cwd })

    packager.stdout.on('data', (data) => {
      log.info(data)
    })

    packager.stderr.on('data', (data) => {
      log.error(data)
    })

    packager.on('close', (code) => {
      log.info(`React Native Packager exited with code ${code}`)
    })
  }

  startPackagerInNewWindow () {
    return this.isPackagerRunning().then((result) => {
      if (!result) {
        log.info('starting packager')
        const scriptFile = `launchPackager.command`
        const scriptsDir = path.resolve(__dirname, '..', 'scripts')
        const launchPackagerScript = path.resolve(scriptsDir, scriptFile)
        const procConfig = {cwd: scriptsDir, detached: true}

        fileUtils.writeFile(`${scriptsDir}/packageRunner.config`, `cwd="${shell.pwd()}"`).then(() => {
          try {
            return spawn(`open`, [launchPackagerScript], procConfig)
          } catch (e) {
            log.error(`Error: ${e}`)
          }
        })
      } else {
        log.info('Packager is already running, will continue to run the app')
      }
    })
  }

  async isPackagerRunning () {
    return fetch('http://localhost:8081/status').then(
      res => res.text().then(body =>
        body === 'packager-status:running'
      ),
      () => false
    )
  }
}
