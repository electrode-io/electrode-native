// @flow
import type { Publisher } from './Publisher'
import gitCli from './gitCli'

export default class GithubPublisher implements Publisher {
  url: string
  _name: string = 'github'

  constructor (url: string) {
    this.url = url
  }

  get name (): string {
    return this._name
  }

  async publish ({commitMessage, tag}: { commitMessage: string, tag?: string } = {}) {
    try {
      const git = gitCli()
      await git.addAsync('./*')
      await git.commitAsync(commitMessage)
      if (tag) {
        await git.tagAsync([tag])
      }
      await git.pushAsync('origin', 'master')
      await git.pushTagsAsync('origin')
    } catch (e) {
      log.error(`Git push failed: ${e}`)
    }
  }
}
