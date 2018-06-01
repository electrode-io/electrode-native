import { readJSON, writeJSON } from './fs-util'
import BaseGit from './BaseGit'
import fs from 'fs'
import path from 'path'
import { Cauldron, ICauldronDocumentStore } from './types'
import { schemaVersion } from './schemas'
const CAULDRON_FILENAME = 'cauldron.json'

export default class GitDocumentStore extends BaseGit
  implements ICauldronDocumentStore {
  public readonly jsonPath: string
  private cauldron: Cauldron

  constructor(
    cauldronPath: string,
    repository: string,
    branch: string = 'master',
    cauldron: Cauldron = {
      nativeApps: [],
      schemaVersion,
    }
  ) {
    super(cauldronPath, repository, branch)
    this.jsonPath = path.resolve(this.fsPath, CAULDRON_FILENAME)
    this.cauldron = cauldron
  }

  // ===========================================================
  // ICauldronDocumentAccess implementation
  // ===========================================================

  public async commit(message: string = 'Commit') {
    await writeJSON(this.jsonPath, this.cauldron)
    await this.git.addAsync(CAULDRON_FILENAME)
    if (!this.pendingTransaction) {
      await this.git.commitAsync(message)
      await this.push()
    }
  }

  public async getCauldron(): Promise<Cauldron> {
    await this.sync()
    if (fs.existsSync(this.jsonPath)) {
      this.cauldron = <Cauldron>await readJSON(this.jsonPath)
    }
    return this.cauldron
  }
}
