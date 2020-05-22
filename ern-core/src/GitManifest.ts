import { PackagePath } from './PackagePath'
import shell from './shell'
import { gitCli } from './gitCli'
import fs from 'fs-extra'
import path from 'path'
import Platform from './Platform'
import log from './log'
import kax from './kax'
import { LocalManifest } from './LocalManifest'

export default class GitManifest extends LocalManifest {
  public readonly remote?: string
  public readonly branch?: string
  private readonly git: any

  private hasSynced: boolean

  public constructor(
    public readonly repoLocalPath: string,
    public readonly repoRemotePath?: string,
    { branch, remote }: { branch: string; remote: string } = {
      branch: 'master',
      remote: 'origin',
    }
  ) {
    super(repoLocalPath)
    this.git = gitCli(repoLocalPath)
    this.remote = remote
    this.branch = branch
    this.hasSynced = false
  }

  public async sync() {
    if (this.repoRemotePath) {
      log.debug(`[GitManifest] Syncing ${this.repoRemotePath}`)
    }

    if (!fs.existsSync(path.join(this.repoLocalPath, '.git'))) {
      log.debug(
        `[GitManifest] Creating local repository in ${this.repoLocalPath}`
      )
      shell.mkdir('-p', this.repoLocalPath)
      await this.git.init()
      if (this.repoRemotePath) {
        await this.git.addRemote(this.remote, this.repoRemotePath)
      }
    }

    if (this.repoRemotePath) {
      await this.git.raw([
        'remote',
        'set-url',
        this.remote,
        this.repoRemotePath,
      ])

      try {
        log.debug(`[GitManifest] Fetching from ${this.remote} master`)
        await this.git.fetch(this.remote, 'master')
      } catch (e) {
        if (e.message.includes(`Couldn't find remote ref master`)) {
          throw new Error(
            `It looks like no remote Manifest repository exist at ${this.repoRemotePath}`
          )
        } else {
          throw e
        }
      }

      await this.git.reset(['--hard', `${this.remote}/master`])
      await this.git.pull(this.remote, this.branch)
    }
  }

  /**
   * We only sync once during a whole "session"
   * (in our context : "an ern command exection")
   * This is done to speed up things as during a single command execution,
   * multiple manifest access can be performed.
   * If you need to access a `Manifest` in a different context, a long session,
   *  you might want to improve the code to act a bit smarter.
   */
  public async syncIfNeeded() {
    if (!this.hasSynced) {
      await kax
        .task(`Syncing ${this.repoRemotePath || this.repoLocalPath} Manifest`)
        .run(this.sync())
      this.hasSynced = true
    }
  }

  public async getManifest(): Promise<any> {
    await this.syncIfNeeded()
    return super.getManifest()
  }

  public async hasManifestId(manifestId: string): Promise<boolean> {
    await this.syncIfNeeded()
    return super.hasManifestId(manifestId)
  }

  public async getManifestData({
    manifestId = 'default',
    platformVersion = Platform.currentVersion,
  }: {
    manifestId?: string
    platformVersion?: string
  } = {}): Promise<any | void> {
    await this.syncIfNeeded()
    return super.getManifestData({ manifestId, platformVersion })
  }

  public async getPluginConfigurationPath(
    plugin: PackagePath,
    platformVersion: string = Platform.currentVersion
  ): Promise<string | void> {
    await this.syncIfNeeded()
    return super.getPluginConfigurationPath(plugin, platformVersion)
  }
}
