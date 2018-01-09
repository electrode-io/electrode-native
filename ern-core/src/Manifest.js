// @flow

import PackagePath from './PackagePath'
import shell from './shell'
import path from 'path'
import Platform from './Platform'
import GitManifest from './GitManifest'
import Mustache from 'mustache'
import _ from 'lodash'
import fs from 'fs'
import {
  isDependencyApi,
  isDependencyApiImpl,
  getCauldronInstance
} from './utils'

export type PluginConfig = {
  android: Object,
  ios: Object,
  origin?: Object,
  path?: string
}

const pluginConfigFileName = 'config.json'
const npmScopeModuleRe = /@(.*)\/(.*)/

const ERN_MANIFEST_MASTER_GIT_REPO = `https://github.com/electrode-io/electrode-native-manifest.git`

export class Manifest {
  _masterManifest: GitManifest
  _overrideManifest: GitManifest
  _manifestOverrideType: 'partial' | 'full'

  constructor (masterManifest: GitManifest) {
    this._masterManifest = masterManifest
  }

  async initOverrideManifest () {
    const cauldronInstance = await getCauldronInstance()
    if (!this._overrideManifest && cauldronInstance) {
      const manifestConfig = await cauldronInstance.getManifestConfig()
      if (manifestConfig && manifestConfig.override && manifestConfig.override.url) {
        this._overrideManifest = new GitManifest(Platform.overrideManifestDirectory, manifestConfig.override.url)
        this._manifestOverrideType = manifestConfig.override.type || 'partial'
      }
    }
  }

  async getManifestData (platformVersion: string) {
    await this.initOverrideManifest()
    let manifestData = {}
    if (this._overrideManifest && this._manifestOverrideType === 'partial') {
      // Merge both manifests. If a dependency exists at two different versions in both
      // manifest, the ovveride will take precedence for the version
      const overrideManifestData = await this._overrideManifest.getManifestData(platformVersion)
      const masterManifestData = await this._masterManifest.getManifestData(platformVersion)

      manifestData.targetNativeDependencies = _.unionBy(
        overrideManifestData ? overrideManifestData.targetNativeDependencies : [],
        masterManifestData ? masterManifestData.targetNativeDependencies : [],
        d => PackagePath.fromString(d).basePath)

      manifestData.targetJsDependencies = _.unionBy(
        overrideManifestData ? overrideManifestData.targetJsDependencies : [],
        masterManifestData ? masterManifestData.targetJsDependencies : [],
        d => PackagePath.fromString(d).basePath)
    } else if (this._overrideManifest && this._manifestOverrideType === 'full') {
      manifestData = await this._overrideManifest.getManifestData(platformVersion)
    } else {
      manifestData = await this._masterManifest.getManifestData(platformVersion)
    }
    return manifestData
  }

  async getNativeDependencies (platformVersion: string = Platform.currentVersion) : Promise<Array<PackagePath>> {
    const manifest = await this.getManifestData(platformVersion)
    return manifest
      ? _.map(manifest.targetNativeDependencies, d => PackagePath.fromString(d))
      : []
  }

  async getJsDependencies (platformVersion: string = Platform.currentVersion) : Promise<Array<PackagePath>> {
    const manifest = await this.getManifestData(platformVersion)
    return manifest
      ? _.map(manifest.targetJsDependencies, d => PackagePath.fromString(d))
      : []
  }

  async getNativeDependency (dependency: PackagePath, platformVersion: string = Platform.currentVersion) : Promise<?PackagePath> {
    const nativeDependencies = await this.getNativeDependencies(platformVersion)
    return _.find(nativeDependencies, d => (d.basePath === dependency.basePath))
  }

  async getJsDependency (dependency: PackagePath, platformVersion: string = Platform.currentVersion) : Promise<?PackagePath> {
    const jsDependencies = await this.getJsDependencies(platformVersion)
    return _.find(jsDependencies, d => (d.basePath === dependency.basePath))
  }

  async getJsAndNativeDependencies (platformVersion: string) {
    const manifest = await this.getManifestData(platformVersion)
    const manifestDeps = manifest
      ? _.union(manifest.targetJsDependencies, manifest.targetNativeDependencies)
      : []
    return _.map(manifestDeps, d => PackagePath.fromString(d))
  }

  async getPluginConfigPath (
    plugin: PackagePath,
    platformVersion: string) : Promise<?string> {
    let pluginConfigPath
    if (this._overrideManifest && this._manifestOverrideType === 'partial') {
      pluginConfigPath = await this._overrideManifest.getPluginConfigurationPath(plugin, platformVersion)
      if (!pluginConfigPath) {
        pluginConfigPath = await this._masterManifest.getPluginConfigurationPath(plugin, platformVersion)
      }
    } else if (this._overrideManifest && this._manifestOverrideType === 'full') {
      pluginConfigPath = await this._overrideManifest.getPluginConfigurationPath(plugin, platformVersion)
    } else {
      pluginConfigPath = await this._masterManifest.getPluginConfigurationPath(plugin, platformVersion)
    }
    return pluginConfigPath
  }

  async isPluginConfigInManifest (
    plugin: PackagePath,
    platformVersion: string) : Promise<boolean> {
    const pluginConfigPath = await this.getPluginConfigPath(plugin, platformVersion)
    return pluginConfigPath !== undefined
  }

  async getPluginConfigFromManifest (
    plugin: PackagePath,
    platformVersion: string,
    projectName: string) : Promise<Object> {
    let pluginConfigPath = await this.getPluginConfigPath(plugin, platformVersion)
    if (!pluginConfigPath) {
      throw new Error(`There is no configuration for ${plugin.basePath} plugin in Manifest matching platform version ${platformVersion}`)
    }

    let result = {}
    let configFile = await fs.readFileSync(path.join(pluginConfigPath, pluginConfigFileName), 'utf-8')
    configFile = Mustache.render(configFile, { projectName })
    result = JSON.parse(configFile)

    // Add default value (convention) for Android subsection for missing fields
    if (result.android) {
      if (result.android.root === undefined) {
        result.android.root = 'android'
      }

      const matchedFiles =
        shell.find(pluginConfigPath).filter(function (file) { return file.match(/\.java$/) })
      if (matchedFiles && matchedFiles.length === 1) {
        result.android.pluginHook = {}
        const pluginHookClass = path.basename(matchedFiles[0], '.java')
        result.android.pluginHook.name = pluginHookClass
        if (fs.readFileSync(matchedFiles[0], 'utf-8').includes('public static class Config')) {
          result.android.pluginHook.configurable = true
        }
      }
    }

    if (result.ios) {
      if (result.ios.root === undefined) {
        result.ios.root = 'ios'
      }

      const matchedHeaderFiles =
        shell.find(pluginConfigPath).filter(function (file) { return file.match(/\.h$/) })
      const matchedSourceFiles =
        shell.find(pluginConfigPath).filter(function (file) { return file.match(/\.m$/) })
      if (matchedHeaderFiles && matchedHeaderFiles.length === 1 && matchedSourceFiles && matchedSourceFiles.length === 1) {
        const pluginHookClass = path.basename(matchedHeaderFiles[0], '.h')
        result.ios.pluginHook = {
          name: pluginHookClass,
          configurable: true
        }
      }
    }
    result.path = pluginConfigPath
    return result
  }

  addOriginPropertyToConfigIfMissing (
    plugin: PackagePath,
    config: Object) : Object {
    if (!config.origin) {
      if (npmScopeModuleRe.test(plugin.basePath)) {
        config.origin = {
          type: 'npm',
          scope: `${npmScopeModuleRe.exec(`${plugin.basePath}`)[1]}`,
          name: `${npmScopeModuleRe.exec(`${plugin.basePath}`)[2]}`,
          version: plugin.version
        }
      } else {
        config.origin = {
          type: 'npm',
          name: plugin.basePath,
          version: plugin.version
        }
      }
    }
    return config
  }

  addOriginVersionPropertyToConfigIfMissing (
    plugin: PackagePath,
    config: Object) : Object {
    if (config.origin && !config.origin.version) {
      config.origin.version = plugin.version
    }
    return config
  }

  async getPluginConfig (
    plugin: PackagePath,
    projectName: string = 'ElectrodeContainer',
    platformVersion: string = Platform.currentVersion) : Promise<PluginConfig> {
    await this.initOverrideManifest()
    let result
    if (await this.isPluginConfigInManifest(plugin, platformVersion)) {
      log.debug('Third party plugin detected. Retrieving plugin configuration from manifest')
      result = await this.getPluginConfigFromManifest(plugin, platformVersion, projectName)
    } else if (await isDependencyApi(plugin.basePath)) {
      log.debug('API plugin detected. Retrieving API plugin default configuration')
      result = this.getApiPluginDefaultConfig(projectName)
    } else if (await isDependencyApiImpl(plugin.basePath)) {
      log.debug('APIImpl plugin detected. Retrieving APIImpl plugin default configuration')
      result = this.getApiImplPluginDefaultConfig(projectName)
    } else {
      throw new Error(`Unsupported plugin. No configuration found in manifest for ${plugin.basePath}`)
    }

    result = this.addOriginPropertyToConfigIfMissing(plugin, result)
    result = this.addOriginVersionPropertyToConfigIfMissing(plugin, result)

    return result
  }

  getApiPluginDefaultConfig (projectName?: string = 'UNKNOWN') : PluginConfig {
    return {
      android: {
        root: 'android',
        moduleName: 'lib',
        transform: [
          { file: 'android/lib/build.gradle' }
        ]
      },
      ios: {
        pluginHook: {
          configurable: false
        },
        copy: [
          {
            source: 'IOS/*',
            dest: `${projectName}/APIs`
          }
        ],
        pbxproj: {
          addSource: [
            {
              from: 'IOS/*.swift',
              path: 'APIs',
              group: 'APIs'
            }
          ]
        }
      }
    }
  }

  getApiImplPluginDefaultConfig (projectName?: string = 'UNKNOWN') : PluginConfig {
    return {
      android: {
        root: 'android',
        moduleName: 'lib',
        transform: [
          { file: 'android/lib/build.gradle' }
        ]
      },
      ios: {
        pluginHook: {
          configurable: false
        },
        copy: [
          {
            source: 'ios/ElectrodeApiImpl/APIImpls/*',
            dest: `${projectName}/APIImpls`
          }
        ],
        pbxproj: {
          addSource: [
            {
              from: 'ios/ElectrodeApiImpl/APIImpls/*.swift',
              path: 'APIImpls',
              group: 'APIImpls'
            }
          ]
        }
      }
    }
  }
}

export default new Manifest(new GitManifest(Platform.masterManifestDirectory, ERN_MANIFEST_MASTER_GIT_REPO))
