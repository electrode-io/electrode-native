import { PackagePath } from './PackagePath'
import _ from 'lodash'
import fs from 'fs-extra'
import path from 'path'
import semver from 'semver'
import Platform from './Platform'

const manifestFileName = 'manifest.json'
const pluginConfigFileName = 'config.json'
const ERN_VERSION_DIRECTORY_RE = /ern_v(.+)\+/

export class LocalManifest {
  public constructor(public readonly manifestPath: string) {
    fs.ensureDirSync(manifestPath)
  }

  public async getManifest(): Promise<any> {
    const pathToManifestJson = path.join(this.manifestPath, manifestFileName)
    return Promise.resolve(
      JSON.parse(fs.readFileSync(pathToManifestJson, 'utf-8'))
    )
  }

  public async hasManifestId(manifestId: string): Promise<boolean> {
    const manifest = await this.getManifest()
    return !Array.isArray(manifest) && manifest[manifestId]
  }

  public async getManifestData({
    manifestId = 'default',
    platformVersion = Platform.currentVersion,
  }: {
    manifestId?: string
    platformVersion?: string
  } = {}): Promise<any | void> {
    const manifest = await this.getManifest()

    return Array.isArray(manifest)
      ? // Old manifest format [to be deprecated]
        _.find(manifest, m =>
          semver.satisfies(platformVersion, m.platformVersion)
        )
      : // New manifest format
        manifest[manifestId]
  }

  /**
   * Return an array containing all top level plugin configuration directories
   * are matching an Electrode Native version lower or equal than the specified
   * maxVersion.
   *
   * For example, given the following directories :
   *
   *  /Users/blemair/.ern/ern-override-manifest/plugins/ern_v0.5.0+
   *  /Users/blemair/.ern/ern-override-manifest/plugins/ern_v0.10.0+
   *  /Users/blemair/.ern/ern-override-manifest/plugins/ern_v0.13.0+
   *
   * And maxVersion='0.10.0'
   *
   * The function would return :
   *
   *  [
   *   '/Users/blemair/.ern/ern-override-manifest/plugins/ern_v0.5.0+',
   *   '/Users/blemair/.ern/ern-override-manifest/plugins/ern_v0.10.0+'
   *  ]
   * @param maxVersion The upper bound Electrode Native version.
   *                   Only plugin configuration directories lower than this
   *                   version will be returned.
   */
  public getPluginsConfigurationDirectories(
    maxVersion: string = Platform.currentVersion
  ): string[] {
    const pathToPluginsDirectory = path.join(this.manifestPath, 'plugins')
    return fs.existsSync(pathToPluginsDirectory)
      ? _(fs.readdirSync(pathToPluginsDirectory))
          .filter(
            d =>
              ERN_VERSION_DIRECTORY_RE.test(d) &&
              semver.lte(ERN_VERSION_DIRECTORY_RE.exec(d)![1], maxVersion)
          )
          .map(d => path.join(pathToPluginsDirectory, d))
          .value()
      : []
  }

  /**
   * Given a fixed versioned plugin, return the local file system path
   * to the directory containing the plugin configuration files, or
   * undefined if no configuration matching this plugin version exists
   * in the Manifest.
   * @param plugin Fixed versioned plugin for which to retrieve configuration
   * @param platformVersion Platform version that is querying for
   *                        the plugin configuration.
   */
  public async getPluginConfigurationPath(
    plugin: PackagePath,
    platformVersion: string = Platform.currentVersion
  ): Promise<string | void> {
    if (!plugin.version) {
      throw new Error(
        `Plugin version is required to retrieve configuration. No version was specified for ${plugin}`
      )
    } else if (!semver.valid(plugin.version)) {
      throw new Error(
        'Plugin version is required to be fixed and not ranged to retrieve configuration'
      )
    }
    let result = await this.getPluginConfigurationPathNew(
      plugin,
      platformVersion
    )
    if (!result) {
      result = await this.getPluginConfigurationPathLegacy(
        plugin,
        platformVersion
      )
    }
    return result
  }

  private async getPluginConfigurationPathNew(
    plugin: PackagePath,
    platformVersion: string = Platform.currentVersion
  ): Promise<string | void> {
    if (!plugin.version) {
      throw new Error(
        `Plugin ${PackagePath.toString()} does not have a version`
      )
    }

    const versionRe = /_v(.+)\+/
    const scopeNameRe = /^(@.+)\/(.+)$/
    const packageNameRe = /(.+)_v\d+\.\d+\.\d+\+/

    // Top level plugin configuration directories ordered by descending
    // Electrode Native version
    // For example :
    // [
    //   '/Users/blemair/.ern/ern-override-manifest/plugins/ern_v0.10.0+',
    //   '/Users/blemair/.ern/ern-override-manifest/plugins/ern_v0.5.0+'
    // ]
    const orderedPluginsConfigurationDirectories = this.getPluginsConfigurationDirectories(
      platformVersion
    ).sort((a, b) =>
      semver.rcompare(versionRe.exec(a)![1], versionRe.exec(b)![1])
    )

    for (const pluginsConfigurationDirectory of orderedPluginsConfigurationDirectories) {
      let pluginScope: string | undefined
      let pluginName: string
      let basePluginPath: string
      if (scopeNameRe.test(plugin.name!)) {
        pluginScope = scopeNameRe.exec(plugin.name!)![1]
        pluginName = scopeNameRe.exec(plugin.name!)![2]
        basePluginPath = path.join(pluginsConfigurationDirectory, pluginScope)
      } else {
        pluginName = plugin.name!
        basePluginPath = pluginsConfigurationDirectory
      }

      if (!fs.existsSync(basePluginPath)) {
        continue
      }

      const pluginConfigDirectories = fs
        .readdirSync(basePluginPath)
        .filter(f => {
          const p = packageNameRe.exec(f)
          return p ? p![1] === pluginName : false
        })

      const pluginVersions = _.map(
        pluginConfigDirectories,
        s => versionRe.exec(s)![1]
      )

      const matchingVersion = _.find(pluginVersions.sort(semver.rcompare), d =>
        semver.gte(plugin.version!, d)
      )
      if (matchingVersion) {
        let pluginConfigurationPath = ''
        pluginConfigurationPath = path.join(
          basePluginPath,
          `${pluginName}_v${matchingVersion}+`
        )
        if (
          fs.existsSync(
            path.join(pluginConfigurationPath, pluginConfigFileName)
          )
        ) {
          return pluginConfigurationPath
        }
      }
    }
  }

  /**
   * Old way of getting plugin configuration path
   *  -- To be deprecated --
   */
  private async getPluginConfigurationPathLegacy(
    plugin: PackagePath,
    platformVersion: string = Platform.currentVersion
  ): Promise<string | void> {
    if (!plugin.version) {
      throw new Error(
        `Plugin ${PackagePath.toString()} does not have a version`
      )
    }

    const versionRe = /_v(.+)\+/
    const orderedPluginsConfigurationDirectories = this.getPluginsConfigurationDirectories(
      platformVersion
    ).sort((a, b) =>
      semver.rcompare(versionRe.exec(a)![1], versionRe.exec(b)![1])
    )

    for (const pluginsConfigurationDirectory of orderedPluginsConfigurationDirectories) {
      // Directory names cannot contain '/', so, replaced by ':'
      const pluginScopeAndName = plugin.name!.replace(/\//g, ':')

      const pluginVersions = _.map(
        fs
          .readdirSync(pluginsConfigurationDirectory)
          .filter(f => f.startsWith(pluginScopeAndName)),
        s => versionRe.exec(s)![1]
      )

      const matchingVersion = _.find(pluginVersions.sort(semver.rcompare), d =>
        semver.gte(plugin.version!, d)
      )
      if (matchingVersion) {
        const pluginConfigurationPath = path.join(
          pluginsConfigurationDirectory,
          `${pluginScopeAndName}_v${matchingVersion}+`
        )
        if (
          fs.existsSync(
            path.join(pluginConfigurationPath, pluginConfigFileName)
          )
        ) {
          return pluginConfigurationPath
        }
      }
    }
  }
}
