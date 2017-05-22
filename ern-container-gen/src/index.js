import { generateMiniAppsComposite as _generateMiniAppsComposite } from './utils'
import _generateContainer from './generateContainer'
import _GithubGenerator from './generators/ios/GithubGenerator'
import _MavenGenerator from './generators/android/MavenGenerator'

export const MavenGenerator = _MavenGenerator
export const GithubGenerator = _GithubGenerator
export const generateContainer = _generateContainer
export const generateMiniAppsComposite = _generateMiniAppsComposite

export default ({
  MavenGenerator: _MavenGenerator,
  GithubGenerator: _GithubGenerator,
  generateContainer: _generateContainer,
  generateMiniAppsComposite: _generateMiniAppsComposite
})
