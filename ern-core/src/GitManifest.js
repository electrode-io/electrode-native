// @flow

import fs from 'fs'
import path from 'path'
import Prom from 'bluebird'
import shell from 'shelljs'
import simpleGit from 'simple-git'

export default class GitManifest {
  _git: any
  _repoRemotePath: string
  _repoAbsoluteLocalPath: string
  _cachedManifest: any
  _remote: string
  _branch: string

  constructor (
    repoLocalPath: string,
    _repoRemotePath: string,
    remote: string = 'origin',
    branch: string = 'master') {
    this._repoAbsoluteLocalPath = path.resolve(repoLocalPath)
    let simpleGitInstance = simpleGit(this._repoAbsoluteLocalPath)
    simpleGitInstance.silent(global.ernLogLevel === 'trace' || global.ernLogLevel === 'debug')
    this._git = Prom.promisifyAll(simpleGitInstance)
    this._repoRemotePath = _repoRemotePath
    this._remote = remote
    this._branch = branch
    this._cachedManifest = null
  }

  get localRepoPath () : string {
    return this._repoAbsoluteLocalPath
  }

  get remoteRepoPath () : string {
    return this._repoRemotePath
  }

  get remote () : string {
    return this._remote
  }

  get branch () : string {
    return this._branch
  }

  async sync () {
    log.debug(`[GitManifest] Syncing ${this._repoRemotePath}`)

    if (!fs.existsSync(path.join(this._repoAbsoluteLocalPath, '.git'))) {
      log.debug(`[GitManifest] Creating local repository in ${this._repoAbsoluteLocalPath}`)
      shell.mkdir('-p', this._repoAbsoluteLocalPath)
      await this._git.initAsync()
      await this._git.addRemoteAsync(this._remote, this._repoRemotePath)
    }

    await this._git.rawAsync([ 'remote', 'set-url', this._remote, this._repoRemotePath ])

    try {
      log.debug(`[GitManifest] Fetching from ${this._remote} master`)
      await this._git.fetchAsync(this._remote, 'master')
    } catch (e) {
      if (e.message.includes(`Couldn't find remote ref master`)) {
        throw new Error(`It looks like no remote Manifest repository exist at ${this._repoRemotePath}`)
      } else {
        throw e
      }
    }

    await this._git.resetAsync(['--hard', `${this._remote}/master`])
    await this._git.pullAsync(this._remote, this._branch)
    const pathToManifestJson = path.join(this._repoAbsoluteLocalPath, 'manifest.json')
    this._cachedManifest = JSON.parse(fs.readFileSync(pathToManifestJson, 'utf-8'))
  }

  async getManifest () : Promise<Object> {
    // We only sync once during a whole "session" (in our context : "an ern command exection")
    // This is done to speed up things as during a single command execution, multiple manifest
    // access can be performed.
    // If you need to access a `Manifest` in a different context, a long session, you might
    // want to improve the code to act a bit smarter.
    if (!this._cachedManifest) {
      await this.sync()
    }
    return this._cachedManifest
  }
}
