import _IosGenerator from './generators/ios/IosGenerator'
import _AndroidGenerator from './generators/android/AndroidGenerator'

import { generateMiniAppsComposite as _generateMiniAppsComposite } from './generateMiniAppsComposite'
import { getContainerPlatform as _getContainerPlatform } from './getContainerPlatform'

export const AndroidGenerator = _AndroidGenerator
export const IosGenerator = _IosGenerator
export const generateMiniAppsComposite = _generateMiniAppsComposite
export const getContainerPlatform = _getContainerPlatform

export default {
  AndroidGenerator: _AndroidGenerator,
  IosGenerator: _IosGenerator,
  generateMiniAppsComposite: _generateMiniAppsComposite,
  getContainerPlatform: _getContainerPlatform,
}

export {
  ContainerGenerator,
  ContainerGeneratorConfig,
  ContainerGenResult,
} from './types'
