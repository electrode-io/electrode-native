import _AndroidGenerator from './generators/android/AndroidGenerator'
import _IosGenerator from './generators/ios/IosGenerator'

import { addElectrodeNativeMetadataFile as _addElectrodeNativeMetadataFile } from './addElectrodeNativeMetadataFile'
import { bundleMiniApps as _bundleMiniApps } from './bundleMiniApps'
import { copyRnpmAssets as _copyRnpmAssets } from './copyRnpmAssets'
import { generateMiniAppsComposite as _generateMiniAppsComposite } from './generateMiniAppsComposite'
import { generatePluginsMustacheViews as _generatePluginsMustacheViews } from './generatePluginsMustacheViews'
import { getContainerPlatform as _getContainerPlatform } from './getContainerPlatform'
import { injectReactNativeVersionKeysInObject as _injectReactNativeVersionKeysInObject } from './injectReactNativeVersionKeysInObject'
import { populateApiImplMustacheView as _populateApiImplMustacheView } from './populateApiImplMustacheView'
import { prepareDirectories as _prepareDirectories } from './prepareDirectories'
import { sortDependenciesByName as _sortDependenciesByName } from './sortDependenciesByName'

export const AndroidGenerator = _AndroidGenerator
export const IosGenerator = _IosGenerator
export const addElectrodeNativeMetadataFile = _addElectrodeNativeMetadataFile
export const bundleMiniApps = _bundleMiniApps
export const copyRnpmAssets = _copyRnpmAssets
export const generateMiniAppsComposite = _generateMiniAppsComposite
export const generatePluginsMustacheViews = _generatePluginsMustacheViews
export const getContainerPlatform = _getContainerPlatform
export const injectReactNativeVersionKeysInObject = _injectReactNativeVersionKeysInObject
export const populateApiImplMustacheView = _populateApiImplMustacheView
export const prepareDirectories = _prepareDirectories
export const sortDependenciesByName = _sortDependenciesByName

export default {
  AndroidGenerator: _AndroidGenerator,
  IosGenerator: _IosGenerator,
  addElectrodeNativeMetadataFile: _addElectrodeNativeMetadataFile,
  bundleMiniApps: _bundleMiniApps,
  copyRnpmAssets: _copyRnpmAssets,
  generateMiniAppsComposite: _generateMiniAppsComposite,
  generatePluginsMustacheViews: _generatePluginsMustacheViews,
  getContainerPlatform: _getContainerPlatform,
  injectReactNativeVersionKeysInObject: _injectReactNativeVersionKeysInObject,
  populateApiImplMustacheView: _populateApiImplMustacheView,
  prepareDirectories: _prepareDirectories,
  sortDependenciesByName: _sortDependenciesByName,
}

export {
  ContainerGenerator,
  ContainerGeneratorConfig,
  ContainerGenResult,
} from './types'
