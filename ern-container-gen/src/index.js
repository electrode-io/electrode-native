// @flow

import { generateMiniAppsComposite as _generateMiniAppsComposite } from './utils'
import _IosGenerator from './generators/ios/IosGenerator'
import _AndroidGenerator from './generators/android/AndroidGenerator'
import _GitHubPublisher from './publishers/GithubPublisher'
import _MavenPublisher from './publishers/MavenPublisher'
import _JcenterPublisher from './publishers/JcenterPublisher'

export const AndroidGenerator = _AndroidGenerator
export const IosGenerator = _IosGenerator
export const generateMiniAppsComposite = _generateMiniAppsComposite
export const MavenPublisher = _MavenPublisher
export const GitHubPublisher = _GitHubPublisher
export const JcenterPublisher = _JcenterPublisher

export default ({
  AndroidGenerator: _AndroidGenerator,
  IosGenerator: _IosGenerator,
  generateMiniAppsComposite: _generateMiniAppsComposite,
  MavenPublisher: _MavenPublisher,
  GitHubPublisher: _GitHubPublisher,
  JcenterPublisher: _JcenterPublisher
})

export type {
  ContainerGenerator,
  ContainerGeneratorConfig,
  ContainerPublisherConfig,
  ContainerMavenPublisherConfig,
  ContainerGenResult
} from './FlowTypes'
