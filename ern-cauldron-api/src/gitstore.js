// @flow

import {
  Platform
} from '@walmart/ern-util'
import {
  readJSON,
  writeJSON
} from './fs-util'
import BaseGit from './base-git'
import fs from 'fs'
import path from 'path'

const CAULDRON_FILENAME = 'cauldron.json'

export default class GitStore extends BaseGit {
  _jsonPath: string
  cauldron: Object

  constructor (
    ernPath: string = Platform.rootDirectory,
    repository: string,
    branch: string = 'master',
    cauldron: Object = {
      'nativeApps': []
    }) {
    super(ernPath, repository, branch)
    this._jsonPath = path.resolve(this.path, CAULDRON_FILENAME)
    this.cauldron = cauldron
  }

  async commit (message: string = 'Commit') {
    await writeJSON(this._jsonPath, this.cauldron)
    await this.git.addAsync(CAULDRON_FILENAME)
    await this.git.commitAsync(message)
    await this.push()
  }

  async getCauldron () {
    await this.sync()
    if (fs.existsSync(this._jsonPath)) {
      this.cauldron = await readJSON(this._jsonPath)
    }
    return this.cauldron
  }
}
