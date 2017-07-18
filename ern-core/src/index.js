// @flow

import * as _plugin from './plugin'
import _handleCopyDirective from './handleCopyDirective'
import _Platform from './Platform'

export const plugin = _plugin
export const handleCopyDirective = _handleCopyDirective
export const Platform = _Platform

export default ({
  plugin: _plugin,
  handleCopyDirective: _handleCopyDirective,
  Platform: _Platform
})
