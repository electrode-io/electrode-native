import { writeFile } from './fs-util'
import BaseGit from './BaseGit'
import fs from 'fs'
import path from 'path'
import { log, shell } from 'ern-core'
import { ICauldronFileStore } from './types'

export default class GitFileStore extends BaseGit
  implements ICauldronFileStore {
  private readonly prefix: string

  constructor(
    ernPath: string,
    repository: string,
    branch: string,
    prefix: string
  ) {
    super(ernPath, repository, branch)
    this.prefix = prefix
  }

  // ===========================================================
  // ICauldronFileAccess implementation
  // ===========================================================

  public async storeFile(identifier: string, content: string | Buffer) {
    await this.sync()
    const storeDirectoryPath = path.resolve(this.fsPath, this.prefix)
    if (!fs.existsSync(storeDirectoryPath)) {
      log.debug(`creating dir ${storeDirectoryPath}`)
      shell.mkdir('-p', storeDirectoryPath)
    }
    const pathToFile = path.resolve(storeDirectoryPath, identifier)
    await writeFile(pathToFile, content, { flag: 'w' })
    await this.git.addAsync(pathToFile)
    if (!this.pendingTransaction) {
      await this.git.commitAsync(`[added file] ${identifier}`)
      await this.push()
    }
  }

  public async hasFile(filename: string) {
    await this.sync()
    try {
      fs.statSync(this._pathToFile(filename)).isFile()
      return true
    } catch (e) {
      return false
    }
  }

  public async getPathToFile(filename: string): Promise<string | void> {
    await this.sync()
    if (fs.existsSync(this._pathToFile(filename))) {
      return this._pathToFile(filename)
    }
  }

  public async getFile(filename: string): Promise<Buffer | void> {
    await this.sync()
    if (fs.existsSync(this._pathToFile(filename))) {
      return fs.readFileSync(this._pathToFile(filename))
    }
  }

  public async removeFile(filename: string): Promise<boolean> {
    await this.sync()
    if (fs.existsSync(this._pathToFile(filename))) {
      await this.git.rmAsync(this._pathToFile(filename))
      if (!this.pendingTransaction) {
        await this.git.commitAsync(`[removed file] ${filename}`)
        await this.push()
      }
      return true
    }
    return false
  }

  private _pathToFile(filename: string) {
    return path.join(this.fsPath, this.prefix, filename)
  }
}
