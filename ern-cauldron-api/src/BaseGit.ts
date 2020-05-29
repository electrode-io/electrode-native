import fs from 'fs-extra'
import path from 'path'
import { gitCli, log } from 'ern-core'
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
    branch?: string
  }) {
    this.fsPath = cauldronPath
    fs.ensureDirSync(this.fsPath)
    this.repository = repository
    this.branch = branch
    this.git = gitCli(this.fsPath)
    this.pendingTransaction = false
    this.hasBeenSynced = false
  }

  public async push() {
    return this.repository ? this.rebaseAndPush() : Promise.resolve()
  }

  public async rebaseAndPush() {
    await this.git.raw(['fetch', GIT_REMOTE_NAME])
    await this.git.raw(['rebase', `${GIT_REMOTE_NAME}/${this.branch}`])
    return this.git.push(GIT_REMOTE_NAME, this.branch)
  }

  public async sync(): Promise<boolean> {
    if (!this.repository) {
      if (!(await fs.pathExists(path.resolve(this.fsPath, '.git')))) {
        await this.git.init()
        await this.doInitialCommit()
      }
      return true
    }

    // We only sync once during a whole "session" (in our context : "an ern command exection")
    // This is done to speed up things as during a single command execution, multiple Cauldron
    // data access can be performed.
    // If you need to access a `Cauldron` in a different context, i.e a long session, you might
    // want to improve the code to act a bit smarter
    if (this.pendingTransaction || this.hasBeenSynced) {
      return Promise.resolve(false)
    }

    log.debug(`[BaseGit] Syncing ${this.fsPath}`)

    if (!(await fs.pathExists(path.resolve(this.fsPath, '.git')))) {
      log.debug(`[BaseGit] New local git repository creation`)
      await this.git.init()
      await this.git.addRemote(GIT_REMOTE_NAME, this.repository)
    }

    await this.git.raw(['remote', 'set-url', GIT_REMOTE_NAME, this.repository])

    const heads = await this.git.raw(['ls-remote', '--heads', GIT_REMOTE_NAME])

    if (!heads) {
      await this.doInitialCommit()
      await this.git.push(GIT_REMOTE_NAME, this.branch)
    } else {
      log.debug(`[BaseGit] Fetching from ${GIT_REMOTE_NAME} ${this.branch}`)
      await this.git.fetch(['--all'])
      await this.git.reset(['--hard', `${GIT_REMOTE_NAME}/${this.branch}`])
    }

    this.hasBeenSynced = true

    return true
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

    await this.git.reset(['--hard'])
    this.pendingTransaction = false
  }

  public async commitTransaction(message: string | string[]) {
    if (!this.pendingTransaction) {
      throw new Error('No pending transaction to commit')
    }

    await this.git.commit(message)
    await this.push()
    this.pendingTransaction = false
  }

  private async doInitialCommit() {
    const fpath = path.resolve(this.fsPath, 'README.md')
    if (!(await fs.pathExists(fpath))) {
      log.debug(`[BaseGit] Performing initial commit`)
      await this.git.raw(['checkout', '-b', this.branch])
      await fs.writeFile(fpath, README)
      await this.git.add('README.md')
      await this.git.commit('First Commit!')
    }
  }
}
