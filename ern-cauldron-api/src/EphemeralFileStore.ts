import fs from 'fs'
import path from 'path'
import { ICauldronFileStore } from './types'
import { createTmpDir } from 'ern-core'

export default class EphemeralFileStore implements ICauldronFileStore {
  public readonly storePath: string
  private latestCommitMessage: string | string[]
  private transactionPending: boolean

  constructor() {
    this.storePath = createTmpDir()
    this.transactionPending = false
  }

  get isPendingTransaction(): boolean {
    return this.transactionPending
  }

  // ===========================================================
  // ICauldronFileAccess implementation
  // ===========================================================

  public async storeFile(identifier: string, content: string | Buffer) {
    const pathToFile = path.join(this.storePath, identifier)
    fs.writeFileSync(pathToFile, content, 'utf8')
    return Promise.resolve()
  }

  public async hasFile(filename: string) {
    try {
      fs.statSync(this.getpathToFile(filename)).isFile()
      return Promise.resolve(true)
    } catch (e) {
      return Promise.resolve(false)
    }
  }

  public async getPathToFile(filename: string): Promise<string | void> {
    if (fs.existsSync(this.getpathToFile(filename))) {
      return this.getpathToFile(filename)
    }
  }

  public async getFile(filename: string): Promise<Buffer | void> {
    if (fs.existsSync(this.getpathToFile(filename))) {
      return fs.readFileSync(this.getpathToFile(filename))
    }
  }

  public async removeFile(filename: string): Promise<boolean> {
    const pathToFile = this.getpathToFile(filename)
    if (fs.existsSync(pathToFile)) {
      fs.unlinkSync(pathToFile)
      if (!this.transactionPending) {
        this.latestCommitMessage = `[removed file] ${filename}`
      }
      return Promise.resolve(true)
    }
    return Promise.resolve(false)
  }

  // ===========================================================
  // ITransactional implementation
  // ===========================================================

  public async beginTransaction() {
    this.transactionPending = true
    return Promise.resolve()
  }

  public async commitTransaction(message: string | string[]) {
    this.transactionPending = false
    this.latestCommitMessage = message
    return Promise.resolve()
  }

  public async discardTransaction() {
    this.transactionPending = false
    return Promise.resolve()
  }

  private getpathToFile(filename: string) {
    return path.join(this.storePath, filename)
  }
}
