import { NativePlatform } from 'ern-core'

export interface ContainerPublisher {
  /**
   *  Name of the Container publisher
   */
  readonly name: string
  /**
   * An array of one or more native platform(s)
   * that the Container publisher supports
   */
  readonly platforms: NativePlatform[]
  /**
   *  Publish a Container
   */
  publish(config: ContainerPublisherConfig): Promise<void>
}

export interface ContainerPublisherConfig {
  /**
   * The publisher to use
   * Can either be
   * - An absolute path to the directory containing the publisher
   * package (mostly to be used for publisher development and testing)
   * - The publisher package to be retrieved from npm registry.
   * In case of a package from a registry  :
   * - If version is omitted, the latest version will be used
   * - If version is specified, the exact version will be used
   */
  publisher: string
  /**
   * Local file system path to the generated Container to publish
   */
  containerPath: string
  /**
   * The platform of the Container to publish
   */
  platform: 'android' | 'ios'
  /**
   * Version to use for publishing the Container
   */
  containerVersion: string
  /**
   * Option url to publish the container to.
   * Specific to the publisher type
   */
  url?: string
  /**
   * Optional extra configuration.
   * Specific to the publisher
   */
  extra?: any
}
