import { ContainerPublisher, ContainerPublisherConfig } from '../FlowTypes'
import { log } from 'ern-core'

export default class UnKnownPublisher implements ContainerPublisher {
  get name(): string {
    return 'UnKnownPublisher'
  }

  public async publish(config: ContainerPublisherConfig) {
    log.warn("I am unknown, I don't know how to publish")
  }
}
