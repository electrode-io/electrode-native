import { PackagePath } from './PackagePath'
import shell from './shell'
import path from 'path'
import Platform from './Platform'
import GitManifest from './GitManifest'
import Mustache from 'mustache'
import _ from 'lodash'
import fs from 'fs'
import { isDependencyApi, isDependencyApiImpl } from './utils'
import config from './config'
import log from './log'

export interface PluginConfig {
  android: any
  ios: any
  origin?: any
  path?: string
}

export interface ManifestOverrideConfig {
  url: string
  type: 'partial' | 'full'
}

const pluginConfigFileName = 'config.json'
const npmScopeModuleRe = /@(.*)\/(.*)/

const ERN_MANIFEST_MASTER_GIT_REPO = `https://github.com/electrode-io/electrode-native-manifest.git`

export class Manifest {
  public static getOverrideManifestConfig: () => Promise<ManifestOverrideConfig | void>

  public readonly masterManifest: GitManifest
  private manifestOverrideType: 'partial' | 'full'
  private overrideManifest: GitManifest

  constructor(masterManifest: GitManifest) {
    this.masterManifest = masterManifest
  }

  public async initOverrideManifest() {
    if (!this.overrideManifest && Manifest.getOverrideManifestConfig) {
      const overrideManifestConfig = await Manifest.getOverrideManifestConfig()
      if (overrideManifestConfig) {
        const manifestOverrideUrl = this.modifyOverrideManifestUrlIfNeeded(
          overrideManifestConfig.url
        )
        this.manifestOverrideType = overrideManifestConfig.type
        this.overrideManifest = new GitManifest(
          Platform.overrideManifestDirectory,
          manifestOverrideUrl
        )
      }
    }
  }

  public modifyOverrideManifestUrlIfNeeded(url: string) {
    // Sample local config :
    // "overrideManifestUrlModifier": {
    //   "searchValue": "github.com",
    //   "replaceValue": "new.github.com"
    // }
    const overrideManifestUrlModifier = config.getValue(
      'overrideManifestUrlModifier'
    )
    if (overrideManifestUrlModifier) {
      const obj = JSON.parse(overrideManifestUrlModifier)
      url = url.replace(obj.searchValue, obj.replaceValue)
    }
    return url
  }

  public async getManifestData(platformVersion: string) {
    await this.initOverrideManifest()
    let manifestData: any = {}
    if (this.overrideManifest && this.manifestOverrideType === 'partial') {
      // Merge both manifests. If a dependency exists at two different versions in both
      // manifest, the ovveride will take precedence for the version
      const overrideManifestData = await this.overrideManifest.getManifestData(
        platformVersion
      )
      const masterManifestData = await this.masterManifest.getManifestData(
        platformVersion
      )

      manifestData.targetNativeDependencies = _.unionBy(
        overrideManifestData
          ? overrideManifestData.targetNativeDependencies
          : [],
        masterManifestData ? masterManifestData.targetNativeDependencies : [],
        d => PackagePath.fromString(<string>d).basePath
      )

      manifestData.targetJsDependencies = _.unionBy(
        overrideManifestData ? overrideManifestData.targetJsDependencies : [],
        masterManifestData ? masterManifestData.targetJsDependencies : [],
        d => PackagePath.fromString(<string>d).basePath
      )
    } else if (this.overrideManifest && this.manifestOverrideType === 'full') {
      manifestData = await this.overrideManifest.getManifestData(
        platformVersion
      )
    } else {
      manifestData = await this.masterManifest.getManifestData(platformVersion)
    }
    return manifestData
  }

  public async getNativeDependencies(
    platformVersion: string = Platform.currentVersion
  ): Promise<PackagePath[]> {
    const m = await this.getManifestData(platformVersion)
    return m
      ? _.map(m.targetNativeDependencies, d => PackagePath.fromString(d))
      : []
  }

  public async getJsDependencies(
    platformVersion: string = Platform.currentVersion
  ): Promise<PackagePath[]> {
    const m = await this.getManifestData(platformVersion)
    return m
      ? _.map(m.targetJsDependencies, d => PackagePath.fromString(d))
      : []
  }

  public async getNativeDependency(
    dependency: PackagePath,
    platformVersion: string = Platform.currentVersion
  ): Promise<PackagePath | void> {
    const nativeDependencies = await this.getNativeDependencies(platformVersion)
    return _.find(nativeDependencies, d => d.basePath === dependency.basePath)
  }

  public async getJsDependency(
    dependency: PackagePath,
    platformVersion: string = Platform.currentVersion
  ): Promise<PackagePath | void> {
    const jsDependencies = await this.getJsDependencies(platformVersion)
    return _.find(jsDependencies, d => d.basePath === dependency.basePath)
  }

  public async getJsAndNativeDependencies(platformVersion: string) {
    const m = await this.getManifestData(platformVersion)
    const manifestDeps = manifest
      ? _.union(m.targetJsDependencies, m.targetNativeDependencies)
      : []
    return _.map(manifestDeps, d => PackagePath.fromString(<string>d))
  }

  public async getPluginConfigPath(
    plugin: PackagePath,
    platformVersion: string
  ): Promise<string | void> {
    let pluginConfigPath
    if (this.overrideManifest && this.manifestOverrideType === 'partial') {
      pluginConfigPath = await this.overrideManifest.getPluginConfigurationPath(
        plugin,
        platformVersion
      )
      if (!pluginConfigPath) {
        pluginConfigPath = await this.masterManifest.getPluginConfigurationPath(
          plugin,
          platformVersion
        )
      }
    } else if (this.overrideManifest && this.manifestOverrideType === 'full') {
      pluginConfigPath = await this.overrideManifest.getPluginConfigurationPath(
        plugin,
        platformVersion
      )
    } else {
      pluginConfigPath = await this.masterManifest.getPluginConfigurationPath(
        plugin,
        platformVersion
      )
    }
    return pluginConfigPath
  }

  public async isPluginConfigInManifest(
    plugin: PackagePath,
    platformVersion: string
  ): Promise<boolean> {
    const pluginConfigPath = await this.getPluginConfigPath(
      plugin,
      platformVersion
    )
    return pluginConfigPath !== undefined
  }

  public async getPluginConfigFromManifest(
    plugin: PackagePath,
    platformVersion: string,
    projectName: string
  ): Promise<any> {
    const pluginConfigPath = await this.getPluginConfigPath(
      plugin,
      platformVersion
    )
    if (!pluginConfigPath) {
      throw new Error(
        `There is no configuration for ${
          plugin.basePath
        } plugin in Manifest matching platform version ${platformVersion}`
      )
    }

    let result: any = {}
    let configFile = await fs.readFileSync(
      path.join(pluginConfigPath, pluginConfigFileName),
      'utf-8'
    )
    configFile = Mustache.render(configFile, { projectName })
    result = JSON.parse(configFile)

    // Add default value (convention) for Android subsection for missing fields
    if (result.android) {
      if (result.android.root === undefined) {
        result.android.root = 'android'
      }

      const matchedFiles = shell.find(pluginConfigPath).filter(file => {
        return file.match(/\.java$/)
      })
      if (matchedFiles && matchedFiles.length === 1) {
        result.android.pluginHook = {}
        const pluginHookClass = path.basename(matchedFiles[0], '.java')
        result.android.pluginHook.name = pluginHookClass
        if (
          fs
            .readFileSync(matchedFiles[0], 'utf-8')
            .includes('public static class Config')
        ) {
          result.android.pluginHook.configurable = true
        }
      }
    }

    if (result.ios) {
      if (result.ios.root === undefined) {
        result.ios.root = 'ios'
      }

      const matchedHeaderFiles = shell.find(pluginConfigPath).filter(file => {
        return file.match(/\.h$/)
      })
      const matchedSourceFiles = shell.find(pluginConfigPath).filter(file => {
        return file.match(/\.m$/)
      })

      if (
        matchedHeaderFiles &&
        matchedHeaderFiles.length === 1 &&
        matchedSourceFiles &&
        matchedSourceFiles.length === 1
      ) {
        const pluginHookClass = path.basename(matchedHeaderFiles[0], '.h')
        result.ios.pluginHook = {
          configurable: true,
          name: pluginHookClass,
        }
      }
    }
    result.path = pluginConfigPath
    return result
  }

  public addOriginPropertyToConfigIfMissing(
    plugin: PackagePath,
    conf: any
  ): any {
    if (!conf.origin) {
      if (npmScopeModuleRe.test(plugin.basePath)) {
        conf.origin = {
          name: `${npmScopeModuleRe.exec(plugin.basePath)![2]}`,
          scope: `${npmScopeModuleRe.exec(plugin.basePath)![1]}`,
          type: 'npm',
          version: plugin.version,
        }
      } else {
        conf.origin = {
          name: plugin.basePath,
          type: 'npm',
          version: plugin.version,
        }
      }
    }
    return conf
  }

  public addOriginVersionPropertyToConfigIfMissing(
    plugin: PackagePath,
    conf: any
  ): any {
    if (conf.origin && !conf.origin.version) {
      conf.origin.version = plugin.version
    }
    return conf
  }

  public async getPluginConfig(
    plugin: PackagePath,
    projectName: string = 'ElectrodeContainer',
    platformVersion: string = Platform.currentVersion
  ): Promise<PluginConfig> {
    await this.initOverrideManifest()
    let result
    if (await this.isPluginConfigInManifest(plugin, platformVersion)) {
      log.debug(
        'Third party plugin detected. Retrieving plugin configuration from manifest'
      )
      result = await this.getPluginConfigFromManifest(
        plugin,
        platformVersion,
        projectName
      )
    } else if (await isDependencyApi(plugin.basePath)) {
      log.debug(
        'API plugin detected. Retrieving API plugin default configuration'
      )
      result = this.getApiPluginDefaultConfig(projectName)
    } else if (await isDependencyApiImpl(plugin.basePath)) {
      log.debug(
        'APIImpl plugin detected. Retrieving APIImpl plugin default configuration'
      )
      result = this.getApiImplPluginDefaultConfig(projectName)
    } else {
      throw new Error(
        `Unsupported plugin. No configuration found in manifest for ${
          plugin.basePath
        }`
      )
    }

    result = this.addOriginPropertyToConfigIfMissing(plugin, result)
    result = this.addOriginVersionPropertyToConfigIfMissing(plugin, result)

    return result
  }

  public getApiPluginDefaultConfig(
    projectName: string = 'UNKNOWN'
  ): PluginConfig {
    return {
      android: {
        moduleName: 'lib',
        root: 'android',
        transform: [{ file: 'android/lib/build.gradle' }],
      },
      ios: {
        copy: [
          {
            dest: `${projectName}/APIs`,
            source: 'IOS/*',
          },
        ],
        pbxproj: {
          addSource: [
            {
              from: 'IOS/*.swift',
              group: 'APIs',
              path: 'APIs',
            },
          ],
        },
        pluginHook: {
          configurable: false,
        },
      },
    }
  }

  public getApiImplPluginDefaultConfig(
    projectName: string = 'UNKNOWN'
  ): PluginConfig {
    return {
      android: {
        moduleName: 'lib',
        root: 'android',
        transform: [{ file: 'android/lib/build.gradle' }],
      },
      ios: {
        copy: [
          {
            dest: `${projectName}/APIImpls`,
            source: 'ios/ElectrodeApiImpl/APIImpls/*',
          },
        ],
        pbxproj: {
          addSource: [
            {
              from: 'ios/ElectrodeApiImpl/APIImpls/*.swift',
              group: 'APIImpls',
              path: 'APIImpls',
            },
          ],
        },
        pluginHook: {
          configurable: false,
        },
      },
    }
  }
}

export const manifest = new Manifest(
  new GitManifest(
    Platform.masterManifestDirectory,
    ERN_MANIFEST_MASTER_GIT_REPO
  )
)
