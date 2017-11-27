// @flow

import tmp from 'tmp'
import shell from './shell'
import path from 'path'
import fs from 'fs'
import DependencyPath from './DependencyPath'
import { execp } from './childProcess'

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
    // In that case, for some reason it copies the node_modules directory of this path, which
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
      shell.rm('-rf', path.join(tmpDirPath, 'node_modules'))
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
  }: {
    field?: string,
    json?: boolean
  } = {}) {
    if (dependencyPath.isAFileSystemPath) {
      const packageJsonPath = path.join(dependencyPath.toString().substr(5), `package.json`)
      log.debug(`[runYarnCommand] Running info: returning ${packageJsonPath} `)
      return JSON.parse(fs.readFileSync(packageJsonPath, `utf-8`))
    } else {
      const cmd = `info ${dependencyPath.toString()} ${field || ''} ${json ? '--json' : ''}`
      const output = await this.runYarnCommand(cmd)

      // Assume single line of yarn JSON output in stdout for yarn info
      const outputStr = output.toString()
      if (outputStr === '') {
        throw new Error(`Could not find ${dependencyPath.toString()} package`)
      }
      return JSON.parse(output.toString())
    }
  }

  async runYarnCommand (command: string) : Promise<string | Buffer> {
    const cmd = `${this.binaryPath} ${command}`
    log.debug(`[runYarnCommand] Running ${cmd}`)
    return execp(cmd)
  }
}
