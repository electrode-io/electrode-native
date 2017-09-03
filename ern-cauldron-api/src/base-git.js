// @flow

import {
  writeFile
} from './fs-util'
import Prom from 'bluebird'
import fs from 'fs'
import path from 'path'
import shell from 'shelljs'
import simpleGit from 'simple-git'

const GIT_REMOTE_NAME = 'upstream'
const README = '### Cauldron Repository'

export default class BaseGit {
  path: string
  repository: string
  branch: string
  git: any
  _pendingTransaction: boolean

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

  async commitTransaction () {
    if (!this._pendingTransaction) {
      throw new Error('No pending transaction to commit')
    }

    await this.push()
    this._pendingTransaction = false
  }

  async push () {
    return this.git.pushAsync(GIT_REMOTE_NAME, this.branch)
  }

  async sync () {
    if (this._pendingTransaction) {
      return Promise.resolve()
    }
    if (!fs.existsSync(path.resolve(this.path, '.git'))) {
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
      await this.git.fetchAsync(GIT_REMOTE_NAME, 'master')
    } catch (e) {
      if (e.message.includes(`Couldn't find remote ref master`)) {
        await this._doInitialCommit()
      } else {
        throw e
      }
    }

    await this.git.resetAsync(['--hard', `${GIT_REMOTE_NAME}/master`])
  }

  async _doInitialCommit () {
    log.debug('Performing initial commit')
    const fpath = path.resolve(this.path, 'README.md')
    if (!fs.existsSync(fpath)) {
      await writeFile(fpath, README, {encoding: 'utf8'})
      await this.git.addAsync('README.md')
      await this.git.commitAsync('First Commit!')
      return this.push()
    }
  }
}
