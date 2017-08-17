// @flow

import { generateMiniAppsComposite as _generateMiniAppsComposite } from './utils'
import _generateContainer from './generateContainer'
import _IosGenerator from './generators/ios/IosGenerator'
import _AndroidGenerator from './generators/android/AndroidGenerator'

export const AndroidGenerator = _AndroidGenerator
export const IosGenerator = _IosGenerator
export const generateContainer = _generateContainer
export const generateMiniAppsComposite = _generateMiniAppsComposite

export default ({
  AndroidGenerator: _AndroidGenerator,
  IosGenerator: _IosGenerator,
  generateContainer: _generateContainer,
  generateMiniAppsComposite: _generateMiniAppsComposite
})
