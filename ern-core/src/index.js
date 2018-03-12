// @flow

import _handleCopyDirective from './handleCopyDirective'
import _Platform from './Platform'
import _manifest from './Manifest'
import _MavenUtils from './MavenUtils'
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
import * as _android from './android'
import _shell from './shell'
import _spin from './spin'
import _config from './config'
import * as _deviceConfig from './deviceConfig'
import * as _childProcess from './childProcess'
import * as _ios from './ios'
import * as _mustacheUtils from './mustacheUtils'
import _ColoredLog from './coloredLog'
import _ReactNativeCli from './ReactNativeCli'
import _required from './required'
import _tagOneLine from './tagoneline'
import _PackagePath from './PackagePath'
import _NativeApplicationDescriptor from './NativeApplicationDescriptor'
import * as _fileUtils from './fileUtil'
import _YarnCli from './YarnCli'
import _gitCli from './gitCli'
import _CodePushSdk from './CodePushSdk'
import * as _promptUtils from './promptUtils'
import _createTmpDir from './createTmpDir'
import * as _nativeDepenciesVersionResolution from './resolveNativeDependenciesVersions'

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
export const ErnBinaryStore = _ErnBinaryStore
export const IosUtil = _iosUtil
export const CauldronHelper = _CauldronHelper
export const nativeDependenciesLookup = _nativeDependenciesLookup
export const android = _android
export const shell = _shell
export const spin = _spin
export const config = _config
export const deviceConfig = _deviceConfig
export const childProcess = _childProcess
export const ios = _ios
export const ColoredLog = _ColoredLog
export const ReactNativeCli = _ReactNativeCli
export const required = _required
export const tagOneLine = _tagOneLine
export const PackagePath = _PackagePath
export const NativeApplicationDescriptor = _NativeApplicationDescriptor
export const mustacheUtils = _mustacheUtils
export const fileUtils = _fileUtils
export const YarnCli = _YarnCli
export const gitCli = _gitCli
export const CodePushSdk = _CodePushSdk
export const promptUtils = _promptUtils
export const createTmpDir = _createTmpDir
export const nativeDepenciesVersionResolution = _nativeDepenciesVersionResolution

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
  ErnBinaryStore: _ErnBinaryStore,
  IosUtil: _iosUtil,
  CauldronHelper: _CauldronHelper,
  nativeDependenciesLookup: _nativeDependenciesLookup,
  android: _android,
  shell: _shell,
  spin: _spin,
  config: _config,
  deviceConfig: _deviceConfig,
  childProcess: _childProcess,
  ios: _ios,
  ColoredLog: _ColoredLog,
  ReactNativeCli: _ReactNativeCli,
  required: _required,
  tagOneLine: _tagOneLine,
  PackagePath: _PackagePath,
  NativeApplicationDescriptor: _NativeApplicationDescriptor,
  mustacheUtils: _mustacheUtils,
  fileUtils: _fileUtils,
  YarnCli: _YarnCli,
  gitCli: _gitCli,
  CodePushSdk: _CodePushSdk,
  promptUtils: _promptUtils,
  createTmpDir: _createTmpDir,
  nativeDepenciesVersionResolution: _nativeDepenciesVersionResolution
})

export type {
  CodePushPackageInfo,
  CodePushPackage
} from './CodePushSdk'
