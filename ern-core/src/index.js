// @flow

import * as _plugin from './plugin'
import _handleCopyDirective from './handleCopyDirective'
import _Platform from './Platform'
import _Manifest from './Manifest'
import _cauldron from './cauldron'

export const plugin = _plugin
export const handleCopyDirective = _handleCopyDirective
export const Platform = _Platform
export const Manifest = _Manifest
export const cauldron = _cauldron

export default ({
  plugin: _plugin,
  handleCopyDirective: _handleCopyDirective,
  Platform: _Platform,
  Manifest: _Manifest,
  cauldron: _cauldron
})
