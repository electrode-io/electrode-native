import { PackagePath, MiniApp, BundlingResult } from 'ern-core'

export interface ContainerGeneratorPaths {
  // Where we assemble the miniapps together
  compositeMiniApp: string
  // Where we download plugins
  pluginsDownloadDirectory: string
  // Where we output final generated container
  outDirectory: string
}

export interface ContainerGeneratorConfig {
  // The MiniApps that should be included in the generated Container
  miniApps: MiniApp[]
  // The plugins that should be included in the generated Container
  plugins: PackagePath[]
  // The JS API implementations that should be included in the generated Container
  jsApiImpls: PackagePath[]
  // The output directory where to generate the Container
  outDir: string
  // Directory where the plugins should be downloaded to during generation
  pluginsDownloadDir: string
  // Directory where the MiniApps will be composed together during generation
  compositeMiniAppDir: string
  // Indicates whether rmpm assets should be included in the Container
  ignoreRnpmAssets?: boolean
  // Path to the current yarn lock
  pathToYarnLock?: string
}

export interface ContainerGenResult {
  // Metadata resulting from the bundling
  bundlingResult: BundlingResult
}

export interface ContainerGenerator {
  // Name of the Container Generator
  readonly name: string
  // Native platform that this generator targets
  readonly platform: string
  // Generate a Container
  generate(config: ContainerGeneratorConfig): Promise<ContainerGenResult>
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

export interface ContainerMavenPublisherConfig {
  // Maven Artifact ID to use for publication
  // Defaults to 'local-container'
  artifactId?: string
  // Maven Group ID to use for publication
  // Defaults to 'com.walmartlabs.ern'
  groupId?: string
  // Maven user name
  // If not specified, by convention, it will use mavenUser from gradle.properties
  mavenUser?: string
  // Maven password
  // If not specified, by convention, it will use mavenPassword from gradle.properties
  mavenPassword?: string
}

export interface ContainerPublisher {
  // Name of the Container Publisher
  readonly name: string
  // Publish a Container
  publish(config: ContainerPublisherConfig): Promise<void>
}
