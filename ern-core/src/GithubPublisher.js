// @flow
import type { Publisher } from './Publisher'
import GitUtils from './GitUtils'

export default class GithubPublisher implements Publisher {
  url: string
  _name: string = 'github'

  constructor (url: string) {
    this.url = url
  }

  get name (): string {
    return this._name
  }

  async publish ({commitMessage, tag}: { commitMessage: string, tag: string } = {}) {
    GitUtils.publish(commitMessage, tag)
  }
}
