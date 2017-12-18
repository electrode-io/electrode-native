// @flow

import _handleCopyDirective from './handleCopyDirective'
import _Platform from './Platform'
import _manifest from './Manifest'
import _MavenUtils from './MavenUtils'
import _Publisher from './Publisher'
import _ContainerGeneratorConfig from './ContainerGeneratorConfig'
import * as _compatibility from './compatibility'
import _MiniApp from './MiniApp'
import * as _ModuleTypes from './ModuleTypes'
import * as _utils from './utils'
import {
  yarn as _yarn,
  reactnative as _reactnative
} from './clients'
import * as _dependencyLookup from './dependencyLookup'
import _ErnBinaryStore from './ErnBinaryStore'
import * as _iosUtil from './iosUtil'
import _CauldronHelper from './CauldronHelper'
import * as _nativeDependenciesLookup from './nativeDependenciesLookup'

export const handleCopyDirective = _handleCopyDirective
export const Platform = _Platform
export const manifest = _manifest
export const compatibility = _compatibility
export const MiniApp = _MiniApp
export const ModuleTypes = _ModuleTypes
export const yarn = _yarn
export const reactnative = _reactnative
export const dependencyLookup = _dependencyLookup
export const utils = _utils
export const MavenUtils = _MavenUtils
export const Publisher = _Publisher
export const ContainerGeneratorConfig = _ContainerGeneratorConfig
export const ErnBinaryStore = _ErnBinaryStore
export const IosUtil = _iosUtil
export const CauldronHelper = _CauldronHelper
export const nativeDependenciesLookup = _nativeDependenciesLookup

export default ({
  handleCopyDirective: _handleCopyDirective,
  Platform: _Platform,
  manifest: _manifest,
  compatibility: _compatibility,
  MiniApp: _MiniApp,
  ModuleTypes: _ModuleTypes,
  yarn: _yarn,
  reactnative: _reactnative,
  dependencyLookup: _dependencyLookup,
  utils: _utils,
  MavenUtils: _MavenUtils,
  Publisher: _Publisher,
  ContainerGeneratorConfig: _ContainerGeneratorConfig,
  ErnBinaryStore: _ErnBinaryStore,
  IosUtil: _iosUtil,
  CauldronHelper: _CauldronHelper,
  nativeDependenciesLookup: _nativeDependenciesLookup
})
