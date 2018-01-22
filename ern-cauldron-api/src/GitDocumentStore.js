// @flow

import {
  readJSON,
  writeJSON
} from './fs-util'
import BaseGit from './BaseGit'
import fs from 'fs'
import path from 'path'
import type {
  Cauldron,
  ICauldronDocumentStore
} from './FlowTypes'
import {
  schemaVersion
} from './schemas'
const CAULDRON_FILENAME = 'cauldron.json'

export default class GitDocumentStore extends BaseGit implements ICauldronDocumentStore {
  _jsonPath: string
  cauldron: Object

  constructor (
    cauldronPath: string,
    repository: string,
    branch: string = 'master',
    cauldron: Object = {
      'nativeApps': [],
      schemaVersion
    }) {
    super(cauldronPath, repository, branch)
    this._jsonPath = path.resolve(this.path, CAULDRON_FILENAME)
    this.cauldron = cauldron
  }

  // ===========================================================
  // ICauldronDocumentAccess implementation
  // ===========================================================

  async commit (message: string = 'Commit') {
    await writeJSON(this._jsonPath, this.cauldron)
    await this.git.addAsync(CAULDRON_FILENAME)
    if (!this._pendingTransaction) {
      await this.git.commitAsync(message)
      await this.push()
    }
  }

  async getCauldron () : Promise<Cauldron> {
    await this.sync()
    if (fs.existsSync(this._jsonPath)) {
      this.cauldron = await readJSON(this._jsonPath)
    }
    return this.cauldron
  }
}
