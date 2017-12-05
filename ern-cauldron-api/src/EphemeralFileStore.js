// @flow

import fs from 'fs'
import path from 'path'
import tmp from 'tmp'
import type {
  ICauldronFileStore
} from './FlowTypes'

export default class EphemeralFileStore implements ICauldronFileStore {
  _storePath : string
  _latestCommitMessage: string | Array<string>
  _isPendingTransaction: boolean

  constructor () {
    this._storePath = tmp.dirSync({ unsafeCleanup: true }).name
    this._isPendingTransaction = false
  }

  _pathToFile (filename: string) {
    return path.join(this._storePath, filename)
  }

  get storePath () : string {
    return this._storePath
  }

  get isPendingTransaction () : boolean {
    return this._isPendingTransaction
  }

  // ===========================================================
  // ICauldronFileAccess implementation
  // ===========================================================

  async storeFile (identifier: string, content: string | Buffer) {
    const pathToFile = path.join(this._storePath, identifier)
    fs.writeFileSync(pathToFile, content, 'utf8')
    return Promise.resolve()
  }

  async hasFile (filename: string) {
    try {
      fs.statSync(this._pathToFile(filename)).isFile()
      return Promise.resolve(true)
    } catch (e) {
      return Promise.resolve(false)
    }
  }

  async getPathToFile (filename: string) : Promise<?string> {
    if (fs.existsSync(this._pathToFile(filename))) {
      return this._pathToFile(filename)
    }
  }

  async getFile (filename: string) : Promise<?Buffer> {
    if (fs.existsSync(this._pathToFile(filename))) {
      return fs.readFileSync(this._pathToFile(filename))
    }
  }

  async removeFile (filename: string) : Promise<boolean> {
    const pathToFile = this._pathToFile(filename)
    if (fs.existsSync(pathToFile)) {
      fs.unlinkSync(pathToFile)
      if (!this._pendingTransaction) {
        this._latestCommitMessage = `[removed file] ${filename}`
      }
      return Promise.resolve(true)
    }
    return Promise.resolve(false)
  }

  // ===========================================================
  // ITransactional implementation
  // ===========================================================

  async beginTransaction () {
    this._isPendingTransaction = true
    return Promise.resolve()
  }

  async commitTransaction (message: string | Array<string>) {
    this._isPendingTransaction = false
    this._latestCommitMessage = message
    return Promise.resolve()
  }

  async discardTransaction () {
    this._isPendingTransaction = false
    return Promise.resolve()
  }
}
