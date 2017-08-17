import {
  exec
} from 'child_process'

export default class GitHubPublisher {
  static async gitClone (
    url: string,
    {
      branch,
      destFolder
    }: {
      branch?: string,
      destFolder?: string
    } = {}) {
    let cmd = branch
      ? `git clone --branch ${branch} --depth 1 ${url}`
      : `git clone ${url}`

    if (destFolder) {
      cmd += ` ${destFolder}`
    }

    return new Promise((resolve, reject) => {
      exec(cmd,
        (err, stdout, stderr) => {
          // Git seems to send stuff to stderr :(
          if (err) {
            log.error(err)
            reject(err)
          } else {
            log.debug(stdout || stderr)
            resolve(stdout || stderr)
          }
        })
    })
  }

  static async gitAdd () {
    return new Promise((resolve, reject) => {
      exec('git add .',
        (err, stdout, stderr) => {
          // Git seems to send stuff to stderr :(
          if (err) {
            log.error(err)
            reject(err)
          } else {
            log.debug(stdout || stderr)
            resolve(stdout || stderr)
          }
        })
    })
  }

  static async gitCommit (message: string) {
    let cmd = message
      ? `git commit -m '${message}'`
      : `git commit -m 'no message'`

    return new Promise((resolve, reject) => {
      exec(cmd,
        (err, stdout, stderr) => {
          // Git seems to send stuff to stderr :(
          if (err) {
            log.error(err)
            reject(err)
          } else {
            log.debug(stdout || stderr)
            resolve(stdout || stderr)
          }
        })
    })
  }

  static async gitTag (tag: string) {
    return new Promise((resolve, reject) => {
      exec(`git tag ${tag}`,
        (err, stdout, stderr) => {
          // Git seems to send stuff to stderr :(
          if (err) {
            log.error(err)
            reject(err)
          } else {
            log.debug(stdout || stderr)
            resolve(stdout || stderr)
          }
        })
    })
  }

  static async gitPush (
  {
    remote = 'origin',
    branch = 'master',
    force = false,
    tags = false
  }: {
    remote?: string,
    branch?: string,
    force: boolean,
    tags: boolean
  } = {}) {
    let cmd = `git push ${remote} ${branch} ${force ? '--force' : ''} ${tags ? '--tags' : ''}`

    return new Promise((resolve, reject) => {
      exec(cmd,
        (err, stdout, stderr) => {
          // Git seems to send stuff to stderr :(
          if (err) {
            log.error(err)
            reject(err)
          } else {
            log.debug(stdout || stderr)
            resolve(stdout || stderr)
          }
        })
    })
  }

  /**
   * Creates a commit with all the pending changes, generates a tag(if provided) and pushes(commit and tags) to origin/master branch.
   *
   * Note: this performs a force push
   * @param commitMessage
   * @param tag
   */
  static async gitPublish ({commitMessage, tag}: { commitMessage: string, tag: string }) {
    await this.gitAdd()
    await this.gitCommit(commitMessage)
    if (tag) {
      await this.gitTag(tag)
    }
    await this.gitPush({force: true, tags: tag})
  }
}
