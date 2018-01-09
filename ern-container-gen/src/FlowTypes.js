// @flow

import {
  PackagePath,
  MiniApp
} from 'ern-core'

export type ContainerGeneratorPaths = {
  // Where we assemble the miniapps together
  compositeMiniApp: string;
  // Where we download plugins
  pluginsDownloadDirectory: string;
  // Where we output final generated container
  outDirectory: string;
}

export type ContainerGeneratorConfig = {
  // The MiniApps that should be included in the generated Container
  miniApps: Array<MiniApp>;
  // The plugins that should be included in the generate Container
  plugins: Array<PackagePath>;
  // The output directory where to generate the Container
  outDir: string;
  // Directory where the plugins should be downloaded to during generation
  pluginsDownloadDir: string;
  // Directory where the MiniApps will be composed together during generation
  compositeMiniAppDir: string;
  // Indicates whether rmpm assets should be included in the Container
  ignoreRnpmAssets?: boolean;
  // Path to the current yarn lock
  pathToYarnLock?: string;
}

export interface ContainerGenerator {
  // Generate a Container
  generate(config: ContainerGeneratorConfig) : Promise<void>;
  // Name of the Container Generator
  +name : string;
  // Native platform that this generator targets
  +platform: string;
}

export type ContainerPublisherConfig = {
  // Path to the generate Container to publish
  containerPath: string;
  // Version of the Container to publish
  containerVersion: string;
  // Url to publish the container to
  // The url scheme is specific to the publisher type
  url: string;
  // Extra optional configuration specific to the publisher
  extra?: Object;
}

export type ContainerMavenPublisherConfig = {
  // Maven Artifact ID to use for publication
  artifactId: string;
  // Maven Group ID to use for publication
  groupId: string;
}

export interface ContainerPublisher {
  // Publish a Container
  publish(config: ContainerPublisherConfig): Promise<void>;
  // Name of the Container Publisher
  + name: string;
}
