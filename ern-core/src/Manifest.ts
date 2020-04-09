import { PackagePath } from './PackagePath'
import shell from './shell'
import path from 'path'
import Platform from './Platform'
import GitManifest from './GitManifest'
import { LocalManifest } from './LocalManifest'
import Mustache from 'mustache'
import _ from 'lodash'
import fs from 'fs-extra'
import { isDependencyApi, isDependencyApiImpl } from './utils'
import config from './config'
import log from './log'
import { NativePlatform } from './NativePlatform'

export type PluginConfig<T extends NativePlatform> = T extends 'android'
  ? AndroidPluginConfig
  : IosPluginConfig

export interface ManifestPluginConfig {
  android?: AndroidPluginConfig
  ios?: IosPluginConfig
  origin?: PluginOrigin
  path: string
}

/**
 * Represent a NPM registry package where a plugin source code is located
 */
export interface NpmPluginOrigin {
  /**
   * Identifies the plugin origin (npm)
   */
  type: 'npm'
  /**
   * Optional registry scope of the plugin
   */
  scope?: string
  /**
   * Name of the plugin
   */
  name: string
  /**
   * Version of the plugin
   */
  version?: string
}

/**
 * Represent a Git repository  where a plugin source code is located
 */

export interface GitPluginOrigin {
  /**
   * Identifies the plugin origin (git)
   */
  type: 'git'
  /**
   * Url of the git repository
   */
  url: string
  /**
   * Version of the plugin
   */
  version: string
}

export type PluginOrigin = NpmPluginOrigin | GitPluginOrigin

/**
 * Platform independent plugin configuration
 */
export interface CommonPluginConfig extends CommonPluginDirectives {
  /**
   * Relative path to the directory containing the plugin source code.
   * Will default to 'ios' or 'android' unless specified otherwise.
   */
  root: string
  /**
   * Optional plugin hook
   */
  pluginHook?: PluginHook
  /**
   * Location of the source code of this plugin
   */
  origin: PluginOrigin
  /**
   * Local path to the directory containing the plugin configuration
   */
  path?: string
}

/**
 * Platform independent plugin directives
 */
export interface CommonPluginDirectives {
  /**
   * Apply a git patch
   */
  applyPatch?: PluginApplyPatchDirective
  /**
   * Array of copy directives.
   * Represents the file(s) to be copied from the plugin source code
   * to the Container.
   */
  copy?: PluginCopyDirective[]
  /**
   * Array of replace in file directives.
   * Represents string replacements in plugin files, before adding them
   * to the Container.
   */
  replaceInFile?: PluginReplaceInFileDirective[]
}

/**
 * Represent a Plugin Hook source file.
 * Plugin hooks are mandatory for Android plugins but are optional for
 * iOS plugins (only needed if the plugin is configurable)
 */
export interface PluginHook {
  /**
   * Name of the plugin hook (name of the source file containing the
   * hook, without extension)
   */
  name: string
  /**
   * Indicates if this hook is configurable.
   * It tells whether the plugin requires some configuration to be provided
   * upon instantiation by the client code.
   */
  configurable: boolean
}

/**
 * Android plugin configuration
 */
export interface AndroidPluginConfig extends CommonPluginConfig {
  /**
   * Name of the Android module containing the plugin.
   */
  moduleName: string
  /**
   * Dependencies (maven artifacts) required by this plugin.
   * Will be added as compile statements in Container build.gradle
   */
  dependencies?: string[]
  /**
   * Repositories to retrieves dependencies from.
   * Will be added to the repositories of the Container build.gradle
   */
  repositories?: string[]
  /**
   * Permissions needed by this plugin.
   * Will be added to the Container Android Manifest file.
   */
  permissions?: string[]
  /**
   * An array of one or more Android hardware or software features.
   * Will be added to the Container Android Manifest file.
   */
  features?: string[]
}

/**
 * iOS plugin configuration
 */
export interface IosPluginConfig extends CommonPluginConfig {
  /**
   * Directives specific to Container pbxproj patching
   */
  pbxproj: PbxProjDirectives
  /**
   * Set specific build settings in the plugin pbxproj
   */
  setBuildSettings?: IosPluginSetBuildSettingsDirective[]
  /**
   * Array of public headers to add to the container
   */
  containerPublicHeader?: string[]
}

/**
 * Set of directives to patch a Container pbxproj
 */
export interface PbxProjDirectives {
  /**
   * Add header file(s) to pbxproj
   */
  addHeader?: IosPluginAddHeaderDirective[]
  /**
   * Add file(s) to the pbxproj
   */
  addFile?: IosPluginAddFileDirective[]
  /**
   * Add Framework(s) to the pbxproj
   */
  addFramework?: string[]
  /**
   * Add Framework(s) search path(s) to the pbxproj
   */
  addFrameworkSearchPath?: string[]
  /**
   * Add Header(s) Search path(s) to the pbxproj
   */
  addHeaderSearchPath?: string[]
  /**
   * Add source file(s) to the pbxproj
   */
  addSource?: IosPluginAddSourceDirective[]
  /**
   * Add static library(ies) to the pbxproj
   */
  addStaticLibrary?: string[]
  /**
   * Add Framework reference(s) to the pbxbproj
   */
  addFrameworkReference?: string[]
  /**
   * Add project(s) to the pbxproj
   */
  addProject?: IosPluginAddProjectDirective[]
  /**
   * Add embedded framework(s) to the pbxproj
   */
  addEmbeddedFramework?: string[]
}

/**
 * Add a file to the Container pbxproj
 */
export interface IosPluginAddFileDirective {
  /**
   * Relative path (from plugin root) to the file to add
   */
  path: string
  /**
   * Target iOS project group to add the file to
   */
  group: string
}

/**
 * Add an header to the Container pbxproj
 */
export interface IosPluginAddHeaderDirective {
  /**
   * Source directory and filename widlcard to add
   * ex: IOS/*.swift
   *
   */
  from?: string
  /**
   * Relative path (from plugin root) to the source file(s) to add
   * If `from` is specified, this is the path of the target directory
   * If `from` is not specified, this is the path of the source file
   */
  path: string
  /**
   * Target iOS project group to add the header to
   */
  group: string
  /**
   * Indicates whether the header should be flagged as public or not
   */
  public?: boolean
}

/**
 * Add a source file the Container pbxproj
 */
export interface IosPluginAddSourceDirective {
  /**
   * Source directory and filename widlcard to add
   * ex: IOS/*.swift
   *
   */
  from?: string
  /**
   * Target iOS project group to add the source file to
   */
  group: string
  /**
   * Relative path (from plugin root) to the source file(s) to add
   * If `from` is specified, this is the path of the target directory
   * If `from` is not specified, this is the path of the source file
   */
  path: string
}

/**
 * Copy a file to the Container
 */
export interface PluginCopyDirective {
  /**
   * Relative path (from plugin root) to the file to copy
   */
  source: string
  /**
   * Destination path to copy the file to
   */
  dest: string
}

/**
 * Apply a git patch
 */
export interface PluginApplyPatchDirective {
  /**
   * Relative path (from plugin root) to the patch file to apply
   */

  patch: string
  /**
   * Relative path (from container out directory) from which to run git apply
   */
  root: string
}

/**
 * Replace a string in a Container file
 */
export interface PluginReplaceInFileDirective {
  /**
   * Relative path (from plugin root) of the file to
   * apply a string replacement on
   */
  path: string
  /**
   * The string to replace (can be a RegExp)
   */
  string: string
  /**
   * The replacement string
   */
  replaceWith: string
}

/**
 * Add an external project to the Container pbxproj
 */
export interface IosPluginAddProjectDirective {
  /**
   * Indicates whether the project should be added to the
   * Target Dependencies instead of Link Binary With Libraries
   * section of the target project Build Phases
   */
  addAsTargetDependency?: boolean
  /**
   * Relative path (from plugin root) of the xcodeproj to add
   */
  path: string
  /**
   * Frameworks to add
   */
  frameworks: string[]
  /**
   * Static lib(s) associated to the project
   */
  staticLibs: IosPluginStaticLib[]
  /**
   * Group to add the xcodeproj to
   */
  group: string
}

export interface IosPluginBuildSettings {
  /**
   * Configuration(s) for which these build settings apply.
   * For example [ 'Debug' , 'Release' ]
   */
  configurations: string[]

  /**
   * Build settings as key values pairs
   */
  settings: { [key: string]: string }
}
export interface IosPluginSetBuildSettingsDirective {
  path: string
  buildSettings: IosPluginBuildSettings[] | IosPluginBuildSettings
}

/**
 * iOS Static library representation
 */
export interface IosPluginStaticLib {
  /**
   * Name of the static lib, including extension (.a)
   */
  name: string
  /**
   * Target of the static lib
   */
  target: string
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

  public readonly masterManifest: LocalManifest | GitManifest
  private manifestOverrideType: 'partial' | 'full'
  private overrideManifest: LocalManifest | GitManifest

  constructor(masterManifest: LocalManifest | GitManifest) {
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
        if (await fs.pathExists(manifestOverrideUrl)) {
          this.overrideManifest = new LocalManifest(manifestOverrideUrl)
        } else {
          this.overrideManifest = new GitManifest(
            Platform.overrideManifestDirectory,
            manifestOverrideUrl
          )
        }
      }
    }
  }

  public modifyOverrideManifestUrlIfNeeded(url: string) {
    // Sample local config :
    // "overrideManifestUrlModifier": {
    //   "searchValue": "github.com",
    //   "replaceValue": "new.github.com"
    // }
    const overrideManifestUrlModifier = config.get(
      'overrideManifestUrlModifier'
    )
    if (overrideManifestUrlModifier) {
      const obj = JSON.parse(overrideManifestUrlModifier)
      url = url.replace(obj.searchValue, obj.replaceValue)
    }
    return url
  }

  public async hasManifestId(manifestId: string): Promise<boolean> {
    await this.initOverrideManifest()
    if (this.overrideManifest && this.manifestOverrideType === 'partial') {
      return (
        (await this.masterManifest.hasManifestId(manifestId)) ||
        (await this.overrideManifest.hasManifestId(manifestId))
      )
    } else if (this.overrideManifest && this.manifestOverrideType === 'full') {
      return this.overrideManifest.hasManifestId(manifestId)
    } else {
      return this.masterManifest.hasManifestId(manifestId)
    }
  }

  public async getManifestData({
    manifestId = 'default',
    platformVersion = Platform.currentVersion,
  }: {
    manifestId?: string
    platformVersion?: string
  } = {}) {
    await this.initOverrideManifest()
    let manifestData: any = {}
    if (this.overrideManifest && this.manifestOverrideType === 'partial') {
      // Merge both manifests. If a dependency exists at two different versions in both
      // manifest, the ovveride will take precedence for the version
      const overrideManifestData = await this.overrideManifest.getManifestData({
        manifestId,
        platformVersion,
      })
      const masterManifestData = await this.masterManifest.getManifestData({
        manifestId,
        platformVersion,
      })

      manifestData.targetNativeDependencies = _.unionBy(
        overrideManifestData
          ? overrideManifestData.targetNativeDependencies
          : [],
        masterManifestData ? masterManifestData.targetNativeDependencies : [],
        d => PackagePath.fromString(<string>d).name
      )

      manifestData.targetJsDependencies = _.unionBy(
        overrideManifestData ? overrideManifestData.targetJsDependencies : [],
        masterManifestData ? masterManifestData.targetJsDependencies : [],
        d => PackagePath.fromString(<string>d).name
      )
    } else if (this.overrideManifest && this.manifestOverrideType === 'full') {
      manifestData = await this.overrideManifest.getManifestData({
        manifestId,
        platformVersion,
      })
    } else {
      manifestData = await this.masterManifest.getManifestData({
        manifestId,
        platformVersion,
      })
    }
    return manifestData
  }

  public async getNativeDependencies({
    manifestId,
    platformVersion,
  }: {
    manifestId?: string
    platformVersion?: string
  } = {}): Promise<PackagePath[]> {
    const m = await this.getManifestData({ manifestId, platformVersion })
    return m
      ? _.map(m.targetNativeDependencies, d => PackagePath.fromString(d))
      : []
  }

  public async getJsDependencies({
    manifestId,
    platformVersion,
  }: {
    manifestId?: string
    platformVersion?: string
  } = {}): Promise<PackagePath[]> {
    const m = await this.getManifestData({ manifestId, platformVersion })
    return m
      ? _.map(m.targetJsDependencies, d => PackagePath.fromString(d))
      : []
  }

  public async getNativeDependency(
    dependency: PackagePath,
    {
      manifestId = 'default',
      platformVersion = Platform.currentVersion,
    }: {
      manifestId?: string
      platformVersion?: string
    } = {}
  ): Promise<PackagePath | void> {
    const nativeDependencies = await this.getNativeDependencies({
      manifestId,
      platformVersion,
    })
    return _.find(nativeDependencies, d => d.name === dependency.name)
  }

  public async getJsDependency(
    dependency: PackagePath,
    {
      manifestId,
      platformVersion,
    }: {
      manifestId?: string
      platformVersion?: string
    } = {}
  ): Promise<PackagePath | void> {
    const jsDependencies = await this.getJsDependencies({
      manifestId,
      platformVersion,
    })
    return _.find(jsDependencies, d => d.name === dependency.name)
  }

  public async getJsAndNativeDependencies({
    manifestId,
    platformVersion,
  }: {
    manifestId?: string
    platformVersion?: string
  } = {}) {
    const m = await this.getManifestData({ manifestId, platformVersion })
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
    projectName: string,
    platform: NativePlatform
  ): Promise<PluginConfig<'android' | 'ios'> | undefined> {
    const pluginConfigPath = await this.getPluginConfigPath(
      plugin,
      platformVersion
    )
    if (!pluginConfigPath) {
      throw new Error(
        `There is no configuration for ${plugin.name} plugin in Manifest matching platform version ${platformVersion}`
      )
    }

    let result: ManifestPluginConfig
    let configFile = await fs.readFile(
      path.join(pluginConfigPath, pluginConfigFileName),
      'utf-8'
    )
    configFile = Mustache.render(configFile, { projectName })
    result = JSON.parse(configFile)

    // Add default value (convention) for Android subsection for missing fields
    if (platform === 'android' && result.android) {
      result.android.root = result.android.root ?? 'android'

      const matchedFiles = shell
        .find(pluginConfigPath)
        .filter((file: string) => {
          return file.match(/\.java$/)
        })
      if (matchedFiles && matchedFiles.length === 1) {
        const pluginHookClass = path.basename(matchedFiles[0], '.java')
        result.android.pluginHook = {
          configurable: false,
          name: pluginHookClass,
        }
        if (
          fs
            .readFileSync(matchedFiles[0], 'utf-8')
            .includes('public static class Config')
        ) {
          result.android.pluginHook.configurable = true
        }
      }
      result.android.path = pluginConfigPath
      return result.android
    } else if (platform === 'ios' && result.ios) {
      result.ios.root = result.ios.root ?? 'ios'

      const matchedHeaderFiles = shell
        .find(pluginConfigPath)
        .filter((file: string) => {
          return file.match(/\.h$/)
        })
      const matchedSourceFiles = shell
        .find(pluginConfigPath)
        .filter((file: string) => {
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
      result.ios.path = pluginConfigPath
      return result.ios
    }
  }

  public getDefaultNpmPluginOrigin(plugin: PackagePath): NpmPluginOrigin {
    if (npmScopeModuleRe.test(plugin.name!)) {
      return {
        name: `${npmScopeModuleRe.exec(plugin.name!)![2]}`,
        scope: `${npmScopeModuleRe.exec(plugin.name!)![1]}`,
        type: 'npm',
        version: plugin.version,
      }
    } else {
      return {
        name: plugin.name!,
        type: 'npm',
        version: plugin.version,
      }
    }
  }

  public async getPluginConfig(
    plugin: PackagePath,
    platform: 'android',
    projectName?: string,
    platformVersion?: string
  ): Promise<PluginConfig<'android'> | undefined>

  public async getPluginConfig(
    plugin: PackagePath,
    platform: 'ios',
    projectName?: string,
    platformVersion?: string
  ): Promise<PluginConfig<'ios'> | undefined>

  public async getPluginConfig(
    plugin: PackagePath,
    platform: NativePlatform,
    projectName: string = 'ElectrodeContainer',
    platformVersion: string = Platform.currentVersion
  ): Promise<PluginConfig<'android' | 'ios'> | undefined> {
    await this.initOverrideManifest()
    let result
    if (await isDependencyApi(plugin)) {
      log.debug(
        'API plugin detected. Retrieving API plugin default configuration'
      )
      result = this.getApiPluginDefaultConfig(plugin, projectName, platform)
    } else if (await isDependencyApiImpl(plugin)) {
      log.debug(
        'APIImpl plugin detected. Retrieving APIImpl plugin default configuration'
      )
      result = this.getApiImplPluginDefaultConfig(plugin, projectName, platform)
    } else if (await this.isPluginConfigInManifest(plugin, platformVersion)) {
      log.debug(
        'Third party plugin detected. Retrieving plugin configuration from manifest'
      )
      result = await this.getPluginConfigFromManifest(
        plugin,
        platformVersion,
        projectName,
        platform
      )
    } else {
      log.warn(
        `Unsupported plugin. No configuration found in manifest for ${plugin.name}.`
      )
      return
    }

    if (result && !result.origin) {
      result.origin = this.getDefaultNpmPluginOrigin(plugin)
    } else if (result && !result.origin.version) {
      result.origin.version = plugin.version
    }

    return result
  }

  public getApiPluginDefaultConfig(
    plugin: PackagePath,
    projectName: string = 'UNKNOWN',
    platform: NativePlatform
  ): PluginConfig<'android' | 'ios'> {
    return platform === 'android'
      ? {
          moduleName: 'lib',
          origin: this.getDefaultNpmPluginOrigin(plugin),
          root: 'android',
        }
      : {
          copy: [
            {
              dest: `${projectName}/APIs`,
              source: 'IOS/*',
            },
          ],
          origin: this.getDefaultNpmPluginOrigin(plugin),
          pbxproj: {
            addHeader: [
              {
                from: 'IOS/*.swift',
                group: 'APIs',
                path: 'APIs',
                public: true,
              },
            ],
            addSource: [
              {
                from: 'IOS/*.swift',
                group: 'APIs',
                path: 'APIs',
              },
            ],
          },
          root: 'ios',
        }
  }

  public getApiImplPluginDefaultConfig(
    plugin: PackagePath,
    projectName: string = 'UNKNOWN',
    platform: NativePlatform
  ): PluginConfig<'android' | 'ios'> {
    return platform === 'android'
      ? {
          moduleName: 'lib',
          origin: this.getDefaultNpmPluginOrigin(plugin),
          root: 'android',
        }
      : {
          copy: [
            {
              dest: `${projectName}/APIImpls`,
              source: 'ios/ElectrodeApiImpl/APIImpls/*',
            },
          ],
          origin: this.getDefaultNpmPluginOrigin(plugin),
          pbxproj: {
            addSource: [
              {
                from: 'ios/ElectrodeApiImpl/APIImpls/*.swift',
                group: 'APIImpls',
                path: 'APIImpls',
              },
            ],
          },
          root: 'ios',
        }
  }
}

const manifestLocalConfig = config.get('manifest', {})
const manifestLocalMasterUrl = manifestLocalConfig?.master?.url
export const manifest = manifestLocalMasterUrl
  ? new Manifest(new LocalManifest(manifestLocalMasterUrl))
  : new Manifest(
      new GitManifest(
        Platform.masterManifestDirectory,
        ERN_MANIFEST_MASTER_GIT_REPO
      )
    )
