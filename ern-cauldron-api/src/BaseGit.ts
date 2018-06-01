import { writeFile } from './fs-util'
import fs from 'fs'
import path from 'path'
import { log, shell, gitCli } from 'ern-core'
import { ITransactional } from './types'

const GIT_REMOTE_NAME = 'upstream'
const README = '### Cauldron Repository'

export default class BaseGit implements ITransactional {
  public readonly fsPath: string
  public readonly repository?: string
  public readonly branch: string
  protected git: any
  protected pendingTransaction: boolean
  private hasBeenSynced: boolean

  constructor({
    cauldronPath,
    repository,
    branch = 'master',
  }: {
    cauldronPath: string
    repository?: string
    branch: string
  }) {
    this.fsPath = cauldronPath
    if (!fs.existsSync(this.fsPath)) {
      shell.mkdir('-p', this.fsPath)
    }
    this.repository = repository
    this.branch = branch
    this.git = gitCli(this.fsPath)
    this.pendingTransaction = false
    this.hasBeenSynced = false
  }

  public async push() {
    return this.repository
      ? this.git.pushAsync(GIT_REMOTE_NAME, this.branch)
      : Promise.resolve()
  }

  public async sync() {
    if (!this.repository) {
      if (!fs.existsSync(path.resolve(this.fsPath, '.git'))) {
        await this.git.initAsync()
        await this.doInitialCommit()
      }
      return Promise.resolve()
    }

    // We only sync once during a whole "session" (in our context : "an ern command exection")
    // This is done to speed up things as during a single command execution, multiple Cauldron
    // data access can be performed.
    // If you need to access a `Cauldron` in a different context, i.e a long session, you might
    // want to improve the code to act a bit smarter
    if (this.pendingTransaction || this.hasBeenSynced) {
      return Promise.resolve()
    }

    log.debug(`[BaseGit] Syncing ${this.fsPath}`)

    if (!fs.existsSync(path.resolve(this.fsPath, '.git'))) {
      log.debug(`[BaseGit] New local git repository creation`)
      await this.git.initAsync()
      await this.git.addRemoteAsync(GIT_REMOTE_NAME, this.repository)
    }

    await this.git.rawAsync([
      'remote',
      'set-url',
      GIT_REMOTE_NAME,
      this.repository,
    ])

    const heads = await this.git.rawAsync([
      'ls-remote',
      '--heads',
      GIT_REMOTE_NAME,
    ])

    if (!heads) {
      await this.doInitialCommit()
      await this.push()
    } else {
      log.debug(`[BaseGit] Fetching from ${GIT_REMOTE_NAME} ${this.branch}`)
      await this.git.fetchAsync(['--all'])
      await this.git.resetAsync(['--hard', `${GIT_REMOTE_NAME}/${this.branch}`])
    }

    this.hasBeenSynced = true
  }

  // ===========================================================
  // ITransactional implementation
  // ===========================================================

  public async beginTransaction() {
    if (this.pendingTransaction) {
      throw new Error('A transaction is already pending')
    }

    await this.sync()
    this.pendingTransaction = true
  }

  public async discardTransaction() {
    if (!this.pendingTransaction) {
      throw new Error('No pending transaction to discard')
    }

    await this.git.resetAsync(['--hard'])
    this.pendingTransaction = false
  }

  public async commitTransaction(message: string | string[]) {
    if (!this.pendingTransaction) {
      throw new Error('No pending transaction to commit')
    }

    await this.git.commitAsync(message)
    await this.push()
    this.pendingTransaction = false
  }

  private async doInitialCommit() {
    const fpath = path.resolve(this.fsPath, 'README.md')
    if (!fs.existsSync(fpath)) {
      log.debug(`[BaseGit] Performing initial commit`)
      await this.git.rawAsync(['checkout', '-b', this.branch])
      await writeFile(fpath, README, { encoding: 'utf8' })
      await this.git.addAsync('README.md')
      await this.git.commitAsync('First Commit!')
    }
  }
}
