// @flow

import * as _plugin from './plugin'
import _handleCopyDirective from './handleCopyDirective'
import _Platform from './Platform'
import _Manifest from './Manifest'
import _cauldron from './cauldron'
import * as _compatibility from './compatibility'
import _MiniApp from './MiniApp'

export const plugin = _plugin
export const handleCopyDirective = _handleCopyDirective
export const Platform = _Platform
export const Manifest = _Manifest
export const cauldron = _cauldron
export const compatibility = _compatibility
export const MiniApp = _MiniApp

export default ({
  plugin: _plugin,
  handleCopyDirective: _handleCopyDirective,
  Platform: _Platform,
  Manifest: _Manifest,
  cauldron: _cauldron,
  compatibility: _compatibility,
  MiniApp: _MiniApp
})
