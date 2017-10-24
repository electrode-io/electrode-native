// @flow

import {
  writeFile
} from './fs-util'
import Prom from 'bluebird'
import fs from 'fs'
import path from 'path'
import {
  shell
} from 'ern-util'
import simpleGit from 'simple-git'

const GIT_REMOTE_NAME = 'upstream'
const README = '### Cauldron Repository'

export default class BaseGit {
  path: string
  repository: string
  branch: string
  git: any
  _pendingTransaction: boolean
  _hasBeenSynced: boolean

  constructor (
    cauldronPath: string,
    repository: string,
    branch: string = 'master') {
    this.path = cauldronPath
    if (!fs.existsSync(this.path)) {
      shell.mkdir('-p', this.path)
    }
    this.repository = repository
    this.branch = branch
    let simpleGitInstance = simpleGit(this.path)
    simpleGitInstance.silent(global.ernLogLevel !== 'trace' && global.ernLogLevel !== 'debug')
    this.git = Prom.promisifyAll(simpleGitInstance)
    this._pendingTransaction = false
    this._hasBeenSynced = false
  }

  async beginTransaction () {
    if (this._pendingTransaction) {
      throw new Error('A transaction is already pending')
    }

    await this.sync()
    this._pendingTransaction = true
  }

  async discardTransaction () {
    if (!this._pendingTransaction) {
      throw new Error('No pending transaction to discard')
    }

    await this.git.resetAsync(['--hard'])
    this._pendingTransaction = false
  }

  async commitTransaction (message: string | Array<string>) {
    if (!this._pendingTransaction) {
      throw new Error('No pending transaction to commit')
    }

    await this.git.commitAsync(message)
    await this.push()
    this._pendingTransaction = false
  }

  async push () {
    return this.git.pushAsync(GIT_REMOTE_NAME, this.branch)
  }

  async sync () {
    // We only sync once during a whole "session" (in our context : "an ern command exection")
    // This is done to speed up things as during a single command execution, multiple Cauldron
    // data access can be performed.
    // If you need to access a `Cauldron` in a different context, i.e a long session, you might
    // want to improve the code to act a bit smarter
    if (this._pendingTransaction || this._hasBeenSynced) {
      return Promise.resolve()
    }

    log.debug(`[BaseGit] Syncing ${this.path}`)

    if (!fs.existsSync(path.resolve(this.path, '.git'))) {
      log.debug(`[BaseGit] New local git repository creation`)
      await this.git.initAsync()
      await this.git.addRemoteAsync(GIT_REMOTE_NAME, this.repository)
    }

    await this.git.rawAsync([
      'remote',
      'set-url',
      GIT_REMOTE_NAME,
      this.repository
    ])

    try {
      log.debug(`[BaseGit] Fetching from ${GIT_REMOTE_NAME} master`)
      await this.git.fetchAsync(GIT_REMOTE_NAME, 'master')
    } catch (e) {
      if (e.message.includes(`Couldn't find remote ref master`)) {
        await this._doInitialCommit()
      } else {
        throw e
      }
    }

    await this.git.resetAsync(['--hard', `${GIT_REMOTE_NAME}/master`])
    this._hasBeenSynced = true
  }

  async _doInitialCommit () {
    const fpath = path.resolve(this.path, 'README.md')
    if (!fs.existsSync(fpath)) {
      log.debug(`[BaseGit] Performing initial commit`)
      await writeFile(fpath, README, {encoding: 'utf8'})
      await this.git.addAsync('README.md')
      await this.git.commitAsync('First Commit!')
      return this.push()
    }
  }
}
