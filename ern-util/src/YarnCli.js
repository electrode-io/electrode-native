// @flow

import {
  exec
} from 'child_process'
import tmp from 'tmp'
import shell from 'shelljs'
import DependencyPath from './DependencyPath'

export default class YarnCli {
  _binaryPath: ?string

  constructor (binaryPath?: string) {
    this._binaryPath = binaryPath
  }

  get binaryPath () : string {
    return this._binaryPath ? this._binaryPath : `yarn`
  }

  async add (dependencyPath: DependencyPath,
  {
    dev,
    peer
  } : {
    dev?: boolean,
    peer?: boolean
  } = {}) {
    // Special handling with yarn add when the dependency is a local file path
    // In that case, for some reason it copies the node_modules folder of this path, which
    // is not a wanted behavior, especially for react-native bundling as it will create
    // haste module naming collisions
    // As a temporaray work-around, we copy the whole package directory to a temporary one
    // and remove node_modules from there and use this new path instead when yarn adding
    // Issue has been opened here https://github.com/yarnpkg/yarn/issues/1334
    // (still open as of this comment writing)
    // [Note: We tried another lighter workaround being to just remove the node_modules
    // directory contained within this package after yarn add is executed. Howver subsequent
    // yarn add of a different dependency just reintroduce the error on previous package
    // this is really weird]
    if (dependencyPath.isAFileSystemPath) {
      const tmpDirPath = tmp.dirSync({unsafeCleanup: true}).name
      shell.cp('-R', `${/file:(.+)/.exec(dependencyPath.toString())[1]}/*`, tmpDirPath)
      shell.rm('-rf', `${tmpDirPath}/node_modules`)
      dependencyPath = DependencyPath.fromFileSystemPath(tmpDirPath)
    }

    const cmd = `add ${dependencyPath.toString()} --ignore-engines --exact ${dev ? '--dev' : ''} ${peer ? '--peer' : ''}`
    return this.runYarnCommand(cmd)
  }

  async install () {
    const cmd = `install --ignore-engines`
    return this.runYarnCommand(cmd)
  }

  async upgrade (dependencyPath: DependencyPath) {
    const cmd = `upgrade ${dependencyPath.toString()} --ignore-engines --exact`
    return this.runYarnCommand(cmd)
  }

  async init () {
    const cmd = `init --yes`
    return this.runYarnCommand(cmd)
  }

  async info (dependencyPath: DependencyPath, {
    field,
    json
  } : {
    field?: string,
    json?: boolean
  } = {}) {
    const cmd = `info ${dependencyPath.toString()} ${field || ''} ${json ? '--json' : ''}`
    const output = await this.runYarnCommand(cmd)
    // Assume single line of yarn JSON output in stdout for yarn info
    return JSON.parse(output)
  }

  async runYarnCommand (command: string, {
    json
  } : {
    json?: boolean
  } = {}) {
    const cmd = `${this.binaryPath} ${command}`
    log.debug(`[runYarnCommand] Running ${cmd}`)
    return new Promise((resolve, reject) => {
      exec(cmd, (err, stdout, stderr) => {
        if (err) {
          reject(err)
        } else if (stdout) {
          resolve(stdout)
        } else if (stderr) {
          reject(stderr)
        }
      })
    })
  }
}
