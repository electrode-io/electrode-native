export interface ContainerPublisher {
  // Name of the Container Publisher
  readonly name: string
  // Publish a Container
  publish(config: ContainerPublisherConfig): Promise<void>
}

export interface ContainerPublisherConfig {
  // Publisher name
  publisherName: string
  // Path to the generate Container to publish
  containerPath: string
  // Version of the Container to publish
  containerVersion: string
  // Url to publish the container to
  // The url scheme is specific to the publisher type
  url?: string
  // Extra optional configuration specific to the publisher
  extra?: any
}
