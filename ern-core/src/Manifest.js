// @flow

import {
  Dependency
} from 'ern-util'
import cauldron from './cauldron'
import path from 'path'
import Platform from './Platform'
import GitManifest from './GitManifest'
import Mustache from 'mustache'
import _ from 'lodash'
import fs from 'fs'
import shell from 'shelljs'

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
    if (!this._overrideManifest && cauldron.isActive()) {
      const manifestConfig = await cauldron.getManifestConfig()
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

  // Tp be refactored !
  async getPluginConfig (
    plugin: Dependency,
    projectName: string = 'ElectrodeContainer',
    platformVersion: string = Platform.currentVersion) : Promise<PluginConfig> {
    await this.initOverrideManifest()
    let result = {}
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

    if (pluginConfigPath) {
      let configFile = await fs.readFileSync(`${pluginConfigPath}/${pluginConfigFileName}`, 'utf-8')
      configFile = Mustache.render(configFile, { projectName })
      result = JSON.parse(configFile)

      // Add default value (convention) for Android subsection for missing fields
      if (result.android) {
        if (result.android.root === undefined) {
          result.android.root = 'android'
        }

        if (!result.android.pluginHook) {
          result.android.pluginHook = {}
          const matchedFiles =
            shell.find(pluginConfigPath).filter(function (file) { return file.match(/\.java$/) })
          this.throwIfShellCommandFailed()
          if (matchedFiles && matchedFiles.length === 1) {
            const pluginHookClass = path.basename(matchedFiles[0], '.java')
            result.android.pluginHook.name = pluginHookClass
            if (fs.readFileSync(matchedFiles[0], 'utf-8').includes('public static class Config')) {
              result.android.pluginHook.configurable = true
            }
          }
        }
      }
      if (result.ios) {
        if (result.ios.root === undefined) {
          result.ios.root = 'ios'
        }

        if (!result.ios.pluginHook) {
          const matchedHeaderFiles =
            shell.find(pluginConfigPath).filter(function (file) { return file.match(/\.h$/) })
          this.throwIfShellCommandFailed()
          const matchedSourceFiles =
            shell.find(pluginConfigPath).filter(function (file) { return file.match(/\.m$/) })
          if (matchedHeaderFiles && matchedHeaderFiles.length === 1 && matchedSourceFiles && matchedSourceFiles.length === 1) {
            result.ios.pluginHook = {}
            const pluginHookClass = path.basename(matchedHeaderFiles[0], '.h')
            result.ios.pluginHook.name = pluginHookClass
            result.ios.pluginHook.configurable = true // TODO: CLAIRE change if it should be true on different types of plugins
            result.ios.pluginHook.header = matchedHeaderFiles[0]
            result.ios.pluginHook.source = matchedSourceFiles[0]
          } else {
            result.ios.pluginHook = {}
            result.ios.pluginHook.configurable = false
          }
        }
      }
      result.path = pluginConfigPath
    } else if (plugin.name.endsWith('-api') || plugin.name.endsWith('-api-impl')) {
      log.debug(`API or API IMPL detected. Returning API default config`)
      result = this.getApiPluginDefaultConfig(projectName)
    } else {
      throw new Error(`Unsupported plugin. No configuration found in manifest for ${plugin.toString()}`)
    }

    if (!result.origin) {
      if (npmScopeModuleRe.test(plugin.scopedName)) {
        result.origin = {
          type: 'npm',
          scope: `${npmScopeModuleRe.exec(`${plugin.scopedName}`)[1]}`,
          name: `${npmScopeModuleRe.exec(`${plugin.scopedName}`)[2]}`,
          version: plugin.version
        }
      } else {
        result.origin = {
          type: 'npm',
          name: plugin.name,
          version: plugin.version
        }
      }
    } else if (!result.origin.version) {
      result.origin.version = plugin.version
    }

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

  // Should not be here
  throwIfShellCommandFailed () {
    const shellError = shell.error()
    if (shellError) {
      throw new Error(shellError)
    }
  }
}

export default new Manifest(new GitManifest(Platform.masterManifestDirectory, ERN_MANIFEST_MASTER_GIT_REPO))
