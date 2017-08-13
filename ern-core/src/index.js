// @flow

import * as _pluginUtil from './pluginUtil'
import _handleCopyDirective from './handleCopyDirective'
import _Platform from './Platform'
import _Manifest from './Manifest'
import _cauldron from './cauldron'
import * as _compatibility from './compatibility'
import _MiniApp from './MiniApp'
import * as _ModuleTypes from './ModuleTypes'
import { yarn as _yarn } from './clients'

export const pluginUtil = _pluginUtil
export const handleCopyDirective = _handleCopyDirective
export const Platform = _Platform
export const Manifest = _Manifest
export const cauldron = _cauldron
export const compatibility = _compatibility
export const MiniApp = _MiniApp
export const ModuleTypes = _ModuleTypes
export const yarn = _yarn

export default ({
  pluginUtil: _pluginUtil,
  handleCopyDirective: _handleCopyDirective,
  Platform: _Platform,
  Manifest: _Manifest,
  cauldron: _cauldron,
  compatibility: _compatibility,
  MiniApp: _MiniApp,
  ModuleTypes: _ModuleTypes,
  yarn: _yarn
})
