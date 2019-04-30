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
      ref: this.refForBranch(name),
      repo: this.repo,
      sha,
    }

    log.debug(`git.createRef(${JSON.stringify(opts, null, 2)})`)

    return this.octokit.git.createRef(opts)
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
      ref: this.refForTag(name),
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

    const res = await this.octokit.repos.getCommitRefSha({
      owner: this.owner,
      ref: ofBranch ? this.refForBranch(ofBranch!) : this.refForTag(ofTag!),
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

  public refForTag(tag: string): string {
    return `refs/tags/${tag}`
  }

  public refForBranch(branch: string): string {
    return `refs/heads/${branch}`
  }
}
