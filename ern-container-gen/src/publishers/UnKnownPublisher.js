// @flow
import type { Publisher } from '../FlowTypes'

export default class UnKnownPublisher implements Publisher {
  get name (): string {
    return 'UnKnownPublisher'
  }

  get url (): string {
    return 'unknown_url'
  }

  async publish () {
    log.warn('I am unknown, I don\'t know how to publish')
  }
}
