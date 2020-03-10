import { PackagePath } from 'ern-core'

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
  publisher: PackagePath
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
   * Version of Electrode Native used
   */
  ernVersion?: string
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
  /**
   * Publish the container in place rather
   * than copying it to a temporary directory
   * to run publisher from
   */
  inPlace?: boolean
}
