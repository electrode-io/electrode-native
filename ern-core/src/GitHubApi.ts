import Octokit from '@octokit/rest'
import log from './log'

export class GitHubApi {
  private readonly octokit: Octokit
  private readonly owner: string
  private readonly repo: string

  /**
   * Creates an instance of the GitHubApi class
   *
   * opts: Ocktokit options
   * owner: Org or user owning the repository
   * repo: Name of the repository in which to create the branch
   */
  public constructor({
    opts,
    owner,
    repo,
  }: {
    opts: Octokit.Options | undefined
    owner: string
    repo: string
  }) {
    this.octokit = new Octokit(opts)
    this.owner = owner
    this.repo = repo
  }

  /**
   * Creates a branch in a GitHub repository.
   * The branch can be created from another branch, sha or tag.
   * If none provided, the branch will be created from default branch.
   *
   * fromBranch: Name of the branch to create branch from
   * fromSha: SHA1 of the commit to create branch from
   * fromTag: Name of the tag to create branch from
   * name: Name of the branch to create
   */
  public async createBranch({
    fromBranch,
    fromSha,
    fromTag,
    name,
  }: {
    fromBranch?: string
    fromSha?: string
    fromTag?: string
    name: string
  }) {
    if (!fromBranch && !fromSha && !fromTag) {
      fromBranch = await this.getDefaultBranch()
    }

    const sha = fromSha
      ? fromSha
      : await this.getSha({ ofBranch: fromBranch, ofTag: fromTag })

    const opts = {
      owner: this.owner,
      ref: this.fullBranchRef(name),
      repo: this.repo,
      sha,
    }

    log.debug(`git.createRef(${JSON.stringify(opts, null, 2)})`)

    return this.octokit.git.createRef(opts)
  }

  /**
   * Deletes a branch from the GitHub repository
   *
   * name: Name of the branch to delete
   */
  public async deleteBranch({ name }: { name: string }) {
    const opts = {
      owner: this.owner,
      ref: this.shortBranchRef(name),
      repo: this.repo,
    }

    log.debug(`git.deleteRef(${JSON.stringify(opts, null, 2)})`)

    return this.octokit.git.deleteRef(opts)
  }

  /**
   * Creates a tag in a GitHub repository.
   * The tag can be created from another branch, sha or tag.
   * If none provided, the tag will be created from default branch.
   *
   * fromBranch: Name of the branch to create tag from
   * fromSha: SHA1 of the commit to create tag from
   * fromTag: Name of the tag to create tag from
   * name: Name of the tag to create
   */
  public async createTag({
    fromBranch,
    fromSha,
    fromTag,
    name,
  }: {
    fromBranch?: string
    fromSha?: string
    fromTag?: string
    name: string
  }) {
    if (!fromBranch && !fromSha && !fromTag) {
      fromBranch = await this.getDefaultBranch()
    }

    const sha = fromSha
      ? fromSha
      : await this.getSha({ ofBranch: fromBranch, ofTag: fromTag })

    return this.octokit.git.createRef({
      owner: this.owner,
      ref: this.fullTagRef(name),
      repo: this.repo,
      sha,
    })
  }

  /**
   * Deletes a tag from the GitHub repository
   *
   * name: Name of the tag to delete
   */
  public async deleteTag({ name }: { name: string }) {
    const opts = {
      owner: this.owner,
      ref: this.shortTagRef(name),
      repo: this.repo,
    }

    log.debug(`git.deleteRef(${JSON.stringify(opts, null, 2)})`)

    return this.octokit.git.deleteRef(opts)
  }

  /**
   * Retrieves the content of a given file from the repository
   *
   * path: Path to the file in the repository
   * fromBranch: Branch to retrieve the file from
   * fromTag: Tag to retrieve the file from
   *
   * If neither of fromBranch/fromTag are provided, the file
   * will be retrieved from the default repository branch
   */
  public async getFileContent({
    path,
    fromBranch,
    fromTag,
  }: {
    path: string
    fromBranch?: string
    fromTag?: string
  }): Promise<string> {
    const opts: any = {
      owner: this.owner,
      path,
      repo: this.repo,
    }

    if (fromBranch) {
      opts.ref = this.fullBranchRef(fromBranch)
    } else if (fromTag) {
      opts.ref = this.fullTagRef(fromTag)
    }

    log.debug(`repos.getContents(${JSON.stringify(opts, null, 2)})`)
    const res = await this.octokit.repos.getContents(opts)
    const buff = new Buffer(res.data.content, 'base64')
    return buff.toString('utf8')
  }

  /**
   * Updates the content of a given file in the repository
   *
   * path: Path to the file to update
   * onBranch: Name of the branch on which to update the file
   * newContent: New file content
   * commitMessage: Commit message for this update
   */
  public async updateFileContent({
    path,
    onBranch,
    newContent,
    commitMessage,
  }: {
    path: string
    onBranch?: string
    newContent: string
    commitMessage: string
  }) {
    const sha = (await this.octokit.repos.getContents({
      owner: this.owner,
      path,
      ref: onBranch || undefined,
      repo: this.repo,
    })).data.sha

    const buff = new Buffer(newContent)
    const content = buff.toString('base64')

    return this.octokit.repos.createOrUpdateFile({
      branch: onBranch || undefined,
      content,
      message: commitMessage,
      owner: this.owner,
      path,
      repo: this.repo,
      sha,
    })
  }

  /**
   * Gets the SHA1 of a given branch or tag.
   * If no branch or tag is provided, the SHA1 of the default branch
   * will be returned.
   *
   * ofBranch: Name of the branch to get SHA1 of
   * ofTag: Name of the tag to get SHA1 of
   */
  public async getSha({
    ofBranch,
    ofTag,
  }: {
    ofBranch?: string
    ofTag?: string
  } = {}): Promise<string> {
    if (!ofBranch && !ofTag) {
      ofBranch = await this.getDefaultBranch()
    }

    const res = await this.octokit.repos.getCommit({
      owner: this.owner,
      ref: ofBranch ? this.fullBranchRef(ofBranch!) : this.fullTagRef(ofTag!),
      repo: this.repo,
    })

    return (res.data as any).sha
  }

  /**
   * Gets the default branch name of the repository.
   */
  public async getDefaultBranch(): Promise<string> {
    const res = await this.octokit.repos.get({
      owner: this.owner,
      repo: this.repo,
    })
    return res.data.default_branch
  }

  /**
   * Does a branch name exist in the repository ?
   */
  public async isBranch(x: string): Promise<boolean> {
    try {
      const res = await this.octokit.git.getRef({
        owner: this.owner,
        ref: `heads/${x}`,
        repo: this.repo,
      })
      return res.status === 200
    } catch (e) {
      if (e.status === 404) {
        return false
      } else {
        throw e
      }
    }
  }

  /**
   * Does a tag name exist in the repository ?
   */
  public async isTag(x: string): Promise<boolean> {
    try {
      const res = await this.octokit.git.getRef({
        owner: this.owner,
        ref: `tags/${x}`,
        repo: this.repo,
      })
      return res.status === 200
    } catch (e) {
      if (e.status === 404) {
        return false
      } else {
        throw e
      }
    }
  }

  /**
   * Does a SHA exist in the repository ?
   */
  public async isSha(x: string): Promise<boolean> {
    try {
      const res = await this.octokit.git.getCommit({
        commit_sha: x,
        owner: this.owner,
        repo: this.repo,
      })
      return res.status === 200
    } catch (e) {
      if (e.status === 404) {
        return false
      } else {
        throw e
      }
    }
  }

  public fullTagRef(tag: string): string {
    return `refs/${this.shortTagRef(tag)}`
  }

  public shortTagRef(tag: string): string {
    return `tags/${tag}`
  }

  public fullBranchRef(branch: string): string {
    return `refs/${this.shortBranchRef(branch)}`
  }

  public shortBranchRef(branch: string): string {
    return `heads/${branch}`
  }
}
