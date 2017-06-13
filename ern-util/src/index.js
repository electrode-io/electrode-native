// @flow

import * as _android from './android'
import _coloredLog from './coloredLog'
import _config from './config'
import _Platform from './platform'
import _npm from './npm'
import _reactNative from './reactNative'
import _required from './required'
import _spin from './spin'
import _tagOneLine from './tagoneline'
import _yarn from './yarn'
import _codePush from './codePush'
import _Dependency from './Dependency'
import _NativeApplicationDescriptor from './NativeApplicationDescriptor'
import _noop from './noop'
import _findNativeDependencies from './findNativeDependencies'
import _Utils from './utils'

export const android = _android
export const coloredLog = _coloredLog
export const config = _config
export const Platform = _Platform
export const npm = _npm
export const reactNative = _reactNative
export const required = _required
export const spin = _spin
export const tagOneLine = _tagOneLine
export const yarn = _yarn
export const codePush = _codePush
export const Dependency = _Dependency
export const NativeApplicationDescriptor = _NativeApplicationDescriptor
export const noop = _noop
export const findNativeDependencies = _findNativeDependencies
export const Utils = _Utils

export default ({
  android: _android,
  coloredLog: _coloredLog,
  config: _config,
  Platform: _Platform,
  npm: _npm,
  reactNative: _reactNative,
  required: _required,
  spin: _spin,
  tagOneLine: _tagOneLine,
  yarn: _yarn,
  codePush: _codePush,
  Dependency: _Dependency,
  NativeApplicationDescriptor: _NativeApplicationDescriptor,
  noop: _noop,
  findNativeDependencies: _findNativeDependencies,
  Utils: _Utils
})
