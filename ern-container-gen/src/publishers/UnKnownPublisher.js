// @flow
import type {
  ContainerPublisher,
  ContainerPublisherConfig
} from '../FlowTypes'

export default class UnKnownPublisher implements ContainerPublisher {
  get name (): string {
    return 'UnKnownPublisher'
  }

  async publish (config: ContainerPublisherConfig) {
    log.warn('I am unknown, I don\'t know how to publish')
  }
}
