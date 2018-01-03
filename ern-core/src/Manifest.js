// @flow

import Dependency from './Dependency'
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
        d => Dependency.fromString(d).withoutVersion().toString())

      manifestData.targetJsDependencies = _.unionBy(
        overrideManifestData ? overrideManifestData.targetJsDependencies : [],
        masterManifestData ? masterManifestData.targetJsDependencies : [],
        d => Dependency.fromString(d).withoutVersion().toString())
    } else if (this._overrideManifest && this._manifestOverrideType === 'full') {
      manifestData = await this._overrideManifest.getManifestData(platformVersion)
    } else {
      manifestData = await this._masterManifest.getManifestData(platformVersion)
    }
    return manifestData
  }

  async getNativeDependencies (platformVersion: string = Platform.currentVersion) : Promise<Array<Dependency>> {
    const manifest = await this.getManifestData(platformVersion)
    return manifest
      ? _.map(manifest.targetNativeDependencies, d => Dependency.fromString(d))
      : []
  }

  async getJsDependencies (platformVersion: string = Platform.currentVersion) : Promise<Array<Dependency>> {
    const manifest = await this.getManifestData(platformVersion)
    return manifest
      ? _.map(manifest.targetJsDependencies, d => Dependency.fromString(d))
      : []
  }

  async getNativeDependency (dependency: Dependency, platformVersion: string = Platform.currentVersion) : Promise<?Dependency> {
    const nativeDependencies = await this.getNativeDependencies(platformVersion)
    return _.find(nativeDependencies, d => (d.name === dependency.name) && (d.scope === dependency.scope))
  }

  async getJsDependency (dependency: Dependency, platformVersion: string = Platform.currentVersion) : Promise<?Dependency> {
    const jsDependencies = await this.getJsDependencies(platformVersion)
    return _.find(jsDependencies, d => (d.name === dependency.name) && (d.scope === dependency.scope))
  }

  async getJsAndNativeDependencies (platformVersion: string) {
    const manifest = await this.getManifestData(platformVersion)
    const manifestDeps = manifest
      ? _.union(manifest.targetJsDependencies, manifest.targetNativeDependencies)
      : []
    return _.map(manifestDeps, d => Dependency.fromString(d))
  }

  async getPluginConfigPath (
    plugin: Dependency,
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
    plugin: Dependency,
    platformVersion: string) : Promise<boolean> {
    const pluginConfigPath = await this.getPluginConfigPath(plugin, platformVersion)
    return pluginConfigPath !== undefined
  }

  async getPluginConfigFromManifest (
    plugin: Dependency,
    platformVersion: string,
    projectName: string) : Promise<Object> {
    let pluginConfigPath = await this.getPluginConfigPath(plugin, platformVersion)
    if (!pluginConfigPath) {
      throw new Error(`There is no configuration for ${plugin.name} plugin in Manifest matching platform version ${platformVersion}`)
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

      result.android.pluginHook = {}
      const matchedFiles =
        shell.find(pluginConfigPath).filter(function (file) { return file.match(/\.java$/) })
      if (matchedFiles && matchedFiles.length === 1) {
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

      result.ios.pluginHook = {}
      const matchedHeaderFiles =
        shell.find(pluginConfigPath).filter(function (file) { return file.match(/\.h$/) })
      const matchedSourceFiles =
        shell.find(pluginConfigPath).filter(function (file) { return file.match(/\.m$/) })
      if (matchedHeaderFiles && matchedHeaderFiles.length === 1 && matchedSourceFiles && matchedSourceFiles.length === 1) {
        const pluginHookClass = path.basename(matchedHeaderFiles[0], '.h')
        result.ios.pluginHook.name = pluginHookClass
        result.ios.pluginHook.configurable = true
        result.ios.pluginHook.header = matchedHeaderFiles[0]
        result.ios.pluginHook.source = matchedSourceFiles[0]
      } else {
        result.ios.pluginHook.configurable = false
      }
    }
    result.path = pluginConfigPath
    return result
  }

  addOriginPropertyToConfigIfMissing (
    plugin: Dependency,
    config: Object) : Object {
    if (!config.origin) {
      if (npmScopeModuleRe.test(plugin.scopedName)) {
        config.origin = {
          type: 'npm',
          scope: `${npmScopeModuleRe.exec(`${plugin.scopedName}`)[1]}`,
          name: `${npmScopeModuleRe.exec(`${plugin.scopedName}`)[2]}`,
          version: plugin.version
        }
      } else {
        config.origin = {
          type: 'npm',
          name: plugin.name,
          version: plugin.version
        }
      }
    }
    return config
  }

  addOriginVersionPropertyToConfigIfMissing (
    plugin: Dependency,
    config: Object) : Object {
    if (config.origin && !config.origin.version) {
      config.origin.version = plugin.version
    }
    return config
  }

  async getPluginConfig (
    plugin: Dependency,
    projectName: string = 'ElectrodeContainer',
    platformVersion: string = Platform.currentVersion) : Promise<PluginConfig> {
    await this.initOverrideManifest()
    let result
    if (await this.isPluginConfigInManifest(plugin, platformVersion)) {
      log.debug('Third party plugin detected. Retrieving plugin configuration from manifest')
      result = await this.getPluginConfigFromManifest(plugin, platformVersion, projectName)
    } else if (await isDependencyApi(plugin.scopedName)) {
      log.debug('API plugin detected. Retrieving API plugin default configuration')
      result = this.getApiPluginDefaultConfig(projectName)
    } else if (await isDependencyApiImpl(plugin.scopedName)) {
      log.debug('APIImpl plugin detected. Retrieving APIImpl plugin default configuration')
      result = this.getApiImplPluginDefaultConfig(projectName)
    } else {
      throw new Error(`Unsupported plugin. No configuration found in manifest for ${plugin.name}`)
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
