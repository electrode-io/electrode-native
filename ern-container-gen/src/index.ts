import { generateMiniAppsComposite as _generateMiniAppsComposite } from './utils'
import _IosGenerator from './generators/ios/IosGenerator'
import _AndroidGenerator from './generators/android/AndroidGenerator'

export const AndroidGenerator = _AndroidGenerator
export const IosGenerator = _IosGenerator
export const generateMiniAppsComposite = _generateMiniAppsComposite

export default {
  AndroidGenerator: _AndroidGenerator,
  IosGenerator: _IosGenerator,
  generateMiniAppsComposite: _generateMiniAppsComposite,
}

export {
  ContainerGenerator,
  ContainerGeneratorConfig,
  ContainerGenResult,
} from './FlowTypes'
