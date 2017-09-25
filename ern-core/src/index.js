// @flow

import _handleCopyDirective from './handleCopyDirective'
import _Platform from './Platform'
import _manifest from './Manifest'
import _cauldron from './cauldron'
import _GitUtils from './GitUtils'
import _MavenUtils from './MavenUtils'
import _Publisher from './Publisher'
import _ContainerGeneratorConfig from './ContainerGeneratorConfig'
import * as _compatibility from './compatibility'
import _MiniApp from './MiniApp'
import * as _ModuleTypes from './ModuleTypes'
import * as _utils from './utils'
import {
  yarn as _yarn,
  reactnative as _reactnative,
  codepush as _codepush
} from './clients'
import * as _dependencyLookup from './dependencyLookup'

export const handleCopyDirective = _handleCopyDirective
export const Platform = _Platform
export const manifest = _manifest
export const cauldron = _cauldron
export const compatibility = _compatibility
export const MiniApp = _MiniApp
export const ModuleTypes = _ModuleTypes
export const yarn = _yarn
export const reactnative = _reactnative
export const codepush = _codepush
export const dependencyLookup = _dependencyLookup
export const GitUtils = _GitUtils
export const utils = _utils
export const MavenUtils = _MavenUtils
export const Publisher = _Publisher
export const ContainerGeneratorConfig = _ContainerGeneratorConfig

export default ({
  handleCopyDirective: _handleCopyDirective,
  Platform: _Platform,
  manifest: _manifest,
  cauldron: _cauldron,
  compatibility: _compatibility,
  MiniApp: _MiniApp,
  ModuleTypes: _ModuleTypes,
  yarn: _yarn,
  reactnative: _reactnative,
  codepush: _codepush,
  dependencyLookup: _dependencyLookup,
  GitUtils: _GitUtils,
  utils: _utils,
  MavenUtils: _MavenUtils,
  Publisher: _Publisher,
  ContainerGeneratorConfig: _ContainerGeneratorConfig
})
