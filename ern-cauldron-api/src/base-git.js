import path from 'path'
import {ensureDir, writeFile} from './fs-util'
import fs from 'fs'
import Prom from 'bluebird'
import shell from 'shelljs'
import simpleGit from 'simple-git'

const ERN_PATH = path.resolve(process.env['HOME'], '.ern')
const GIT_REMOTE_NAME = 'upstream'
const README = '### Cauldron Repository'

export default class BaseGit {
  
  constructor(ernPath = ERN_PATH, repository, branch = 'master') {
    this.path = path.resolve(ernPath, 'cauldron')
    if (!fs.existsSync(this.path)) {
      shell.mkdir('-p', this.path)
    }
    this.repository = repository
    this.branch = branch
    this.git = Prom.promisifyAll(simpleGit(this.path))
  }
  
  async push() { 
    return this.git.pushAsync(GIT_REMOTE_NAME, this.branch)
  }
  
  async sync() {
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
      if (/Couldn't find remote ref master/.test(e + '')) {
        await this._doInitialCommit()
      } else {
        throw e
      }
    }
    
    await this.git.resetAsync(['--hard', `${GIT_REMOTE_NAME}/master`])        
  }
  
  async _doInitialCommit() {
    const fpath = path.resolve(this.path, 'README.md')
    if (!fs.existsSync(fpath)) {
      await writeFile(fpath, {encoding: 'utf8'}, README)
      await this.git.addAsync('README.md')
      await this.git.commitAsync('First Commit!')
      return this.push()
    }
  }
}