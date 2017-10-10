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
import spin from './spin'
import tmp from 'tmp'
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
    const bundleCommand =
    `${this.binaryPath} bundle \
${entryFile ? `--entry-file=${entryFile}` : ''} \
${dev ? '--dev=true' : '--dev=false'} \
${platform ? `--platform=${platform}` : ''} \
${bundleOutput ? `--bundle-output=${bundleOutput}` : ''} \
${assetsDest ? `--assets-dest=${assetsDest}` : ''}`

    return new Promise((resolve, reject) => {
      log.debug(`[bundle] Running ${bundleCommand}`)
      exec(bundleCommand,
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

    process.on('SIGINT', () => { packager.kill(); process.exit() })
  }

  async startPackagerInNewWindow (cwd: string, args: Array<string> = []) {
    const isPackagerRunning = await this.isPackagerRunning()

    if (!isPackagerRunning) {
      await spin('Starting React Native packager', Promise.resolve())
      const tmpDir = tmp.dirSync({ unsafeCleanup: true }).name
      const tmpScriptPath = path.join(tmpDir, 'packager.sh')
      await fileUtils.writeFile(tmpScriptPath,
`
cd "${cwd}"; 
echo "Running ${this.binaryPath} start ${args.join(' ')}";
${this.binaryPath} start ${args.join(' ')};
`)
      shell.chmod('+x', tmpScriptPath)
      spawn('open', ['-a', 'Terminal', tmpScriptPath])
    } else {
      log.warn('A React Native Packager is already running in a different process')
    }
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
