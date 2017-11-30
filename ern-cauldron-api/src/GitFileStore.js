// @flow

import {
  writeFile
} from './fs-util'
import BaseGit from './BaseGit'
import fs from 'fs'
import path from 'path'
import {
  shell
} from 'ern-util'
import type {
  ICauldronFileStore
} from './FlowTypes'

export default class GitFileStore extends BaseGit implements ICauldronFileStore {
  _prefix : string

  constructor (
    ernPath: string,
    repository: string,
    branch: string,
    prefix: string) {
    super(ernPath, repository, branch)
    this._prefix = prefix
  }

  _pathToFile (filename: string) {
    return path.join(this.path, this._prefix, filename)
  }

  // ===========================================================
  // ICauldronFileAccess implementation
  // ===========================================================

  async storeFile (identifier: string, content: string | Buffer) {
    await this.sync()
    const storeDirectoryPath = path.resolve(this.path, this._prefix)
    if (!fs.existsSync(storeDirectoryPath)) {
      log.debug(`creating dir ${storeDirectoryPath}`)
      shell.mkdir('-p', storeDirectoryPath)
    }
    const pathToFile = path.resolve(storeDirectoryPath, identifier)
    await writeFile(pathToFile, content, {flag: 'w'})
    await this.git.addAsync(pathToFile)
    if (!this._pendingTransaction) {
      await this.git.commitAsync(`[added file] ${identifier}`)
      await this.push()
    }
  }

  async hasFile (filename: string) {
    await this.sync()
    try {
      fs.statSync(this._pathToFile(filename)).isFile()
      return true
    } catch (e) {
      return false
    }
  }

  async getPathToFile (filename: string) : Promise<?string> {
    await this.sync()
    if (fs.existsSync(this._pathToFile(filename))) {
      return this._pathToFile(filename)
    }
  }

  async getFile (filename: string) : Promise<?Buffer> {
    await this.sync()
    if (fs.existsSync(this._pathToFile(filename))) {
      return fs.readFileSync(this._pathToFile(filename))
    }
  }

  async removeFile (filename: string) : Promise<boolean> {
    await this.sync()
    if (fs.existsSync(this._pathToFile(filename))) {
      await this.git.rmAsync(this._pathToFile(filename))
      if (!this._pendingTransaction) {
        await this.git.commitAsync(`[removed file] ${filename}`)
        await this.push()
      }
      return true
    }
    return false
  }
}
