import path from 'path'
import {writeJSON, readJSON, ensureDir, writeFile} from './fs-util'
import fs from 'fs'
import BaseGit from './base-git'
const ERN_PATH = path.resolve(process.env['HOME'], '.ern')
const CAULDRON_FILENAME = 'cauldron.json'

export default class GitStore extends BaseGit {
  
  constructor(ernPath = ERN_PATH, repository, branch = 'master', cauldron = {
    "nativeApps": []
  }) {
    super(ernPath, repository, branch)
    this._jsonPath = path.resolve(this.path, CAULDRON_FILENAME)
    this.cauldron = cauldron
  }
  
  async commit(message = 'Commit') {
    await writeJSON(this._jsonPath, this.cauldron)
    await this.git.addAsync(CAULDRON_FILENAME)
    await this.git.commitAsync(message)
    await this.push()
  }
  
  async getCauldron() {
    await this.sync()
    if (fs.existsSync(this._jsonPath)) {
      this.cauldron = await readJSON(this._jsonPath)
      return this.cauldron
    }
  }
}
