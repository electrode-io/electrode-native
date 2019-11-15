import fs from 'fs-extra'
import path from 'path'
import { ICauldronFileStore } from './types'
import { createTmpDir } from 'ern-core'
import shell from 'shelljs'

export default class EphemeralFileStore implements ICauldronFileStore {
  public readonly storePath: string
  private latestCommitMessage: string | string[]
  private transactionPending: boolean

  constructor({ storePath }: { storePath?: string } = {}) {
    this.storePath = storePath || createTmpDir()
    this.transactionPending = false
  }

  get isPendingTransaction(): boolean {
    return this.transactionPending
  }

  // ===========================================================
  // ICauldronFileAccess implementation
  // ===========================================================

  public async storeFile(
    identifier: string,
    content: string | Buffer,
    fileMode?: string
  ) {
    const pathToFile = path.join(this.storePath, identifier)
    const pathToDir = path.dirname(pathToFile)
    await fs.ensureDir(pathToDir)
    await fs.writeFile(pathToFile, content, 'utf8')
    if (fileMode) {
      shell.chmod(fileMode, pathToFile)
    }
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
    if (await fs.pathExists(this.getpathToFile(filename))) {
      return this.getpathToFile(filename)
    }
  }

  public async getFile(filename: string): Promise<Buffer | void> {
    if (await fs.pathExists(this.getpathToFile(filename))) {
      return fs.readFileSync(this.getpathToFile(filename))
    }
  }

  public async removeFile(filename: string): Promise<boolean> {
    const pathToFile = this.getpathToFile(filename)
    if (await fs.pathExists(pathToFile)) {
      await fs.unlink(pathToFile)
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
