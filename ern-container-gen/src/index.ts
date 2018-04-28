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

export default {
  AndroidGenerator: _AndroidGenerator,
  GitHubPublisher: _GitHubPublisher,
  IosGenerator: _IosGenerator,
  JcenterPublisher: _JcenterPublisher,
  MavenPublisher: _MavenPublisher,
  generateMiniAppsComposite: _generateMiniAppsComposite,
}

export {
  ContainerGenerator,
  ContainerGeneratorConfig,
  ContainerPublisherConfig,
  ContainerMavenPublisherConfig,
  ContainerGenResult,
} from './FlowTypes'
