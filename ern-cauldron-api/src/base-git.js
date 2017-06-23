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
    this.git = Prom.promisifyAll(simpleGit(this.path))
  }

  async push () {
    return this.git.pushAsync(GIT_REMOTE_NAME, this.branch)
  }

  async sync () {
    if (!fs.existsSync(path.resolve(this.path, '.git'))) {
      // create a new repository on the command line
      // git init
      // git remote add origin https://github.com/
      await this.git.initAsync()
      await this.git.addRemoteAsync(GIT_REMOTE_NAME, this.repository)
      await this._doInitialCommit()
    }

    await this.git.rawAsync([
      'remote',
      'set-url',
      GIT_REMOTE_NAME,
      this.repository
    ])
    try {
      await this.git.fetchAsync(GIT_REMOTE_NAME, 'master')
    } catch (error) {
      console.log(error)
      throw error
    }

    await this.git.resetAsync(['--hard', `${GIT_REMOTE_NAME}/master`])
  }

  async _doInitialCommit () {
    // git add README.md
    // git commit -m "first commit"
    // git push -u origin master
    const fpath = path.resolve(this.path, 'README.md')
    if (!fs.existsSync(fpath)) {
      await writeFile(fpath, {encoding: 'utf8'}, README)
      await this.git.addAsync('README.md')
      await this.git.commitAsync('First Commit!')
      return this.push()
    }
  }
}
