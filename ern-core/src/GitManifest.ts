import { PackagePath } from './PackagePath'
import shell from './shell'
import { gitCli } from './gitCli'
import _ from 'lodash'
import fs from 'fs-extra'
import path from 'path'
import semver from 'semver'
import Platform from './Platform'
import log from './log'
import kax from './kax'

const manifestFileName = 'manifest.json'
const pluginConfigFileName = 'config.json'
const ERN_VERSION_DIRECTORY_RE = /ern_v(.+)\+/

export default class GitManifest {
  public readonly remote?: string
  public readonly branch?: string
  private readonly git: any

  private cachedManifest: any

  public constructor(
    public readonly repoLocalPath: string,
    public readonly repoRemotePath?: string,
    { branch, remote }: { branch: string; remote: string } = {
      branch: 'master',
      remote: 'origin',
    }
  ) {
    fs.ensureDirSync(repoLocalPath)
    this.git = gitCli(repoLocalPath)
    this.remote = remote
    this.branch = branch
    this.cachedManifest = null
  }

  public async sync() {
    if (this.repoRemotePath) {
      log.debug(`[GitManifest] Syncing ${this.repoRemotePath}`)
    }

    if (!fs.existsSync(path.join(this.repoLocalPath, '.git'))) {
      log.debug(
        `[GitManifest] Creating local repository in ${this.repoLocalPath}`
      )
      shell.mkdir('-p', this.repoLocalPath)
      await this.git.init()
      if (this.repoRemotePath) {
        await this.git.addRemote(this.remote, this.repoRemotePath)
      }
    }

    if (this.repoRemotePath) {
      await this.git.raw([
        'remote',
        'set-url',
        this.remote,
        this.repoRemotePath,
      ])

      try {
        log.debug(`[GitManifest] Fetching from ${this.remote} master`)
        await this.git.fetch(this.remote, 'master')
      } catch (e) {
        if (e.message.includes(`Couldn't find remote ref master`)) {
          throw new Error(
            `It looks like no remote Manifest repository exist at ${this.repoRemotePath}`
          )
        } else {
          throw e
        }
      }

      await this.git.reset(['--hard', `${this.remote}/master`])
      await this.git.pull(this.remote, this.branch)
    }

    const pathToManifestJson = path.join(this.repoLocalPath, manifestFileName)
    this.cachedManifest = JSON.parse(
      fs.readFileSync(pathToManifestJson, 'utf-8')
    )
  }

  /**
   * We only sync once during a whole "session"
   * (in our context : "an ern command exection")
   * This is done to speed up things as during a single command execution,
   * multiple manifest access can be performed.
   * If you need to access a `Manifest` in a different context, a long session,
   *  you might want to improve the code to act a bit smarter.
   */
  public async syncIfNeeded() {
    if (!this.cachedManifest) {
      await kax
        .task(`Syncing ${this.repoRemotePath || this.repoLocalPath} Manifest`)
        .run(this.sync())
    }
  }

  public async getManifest(): Promise<any> {
    await this.syncIfNeeded()
    return this.cachedManifest
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
    const pathToPluginsDirectory = path.join(this.repoLocalPath, 'plugins')
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

    await this.syncIfNeeded()
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
      let pluginScope
      let pluginName
      let basePluginPath
      if (scopeNameRe.test(plugin.basePath)) {
        pluginScope = scopeNameRe.exec(plugin.basePath)![1]
        pluginName = scopeNameRe.exec(plugin.basePath)![2]
        basePluginPath = path.join(pluginsConfigurationDirectory, pluginScope)
      } else {
        pluginName = plugin.basePath
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

    await this.syncIfNeeded()
    const versionRe = /_v(.+)\+/
    const orderedPluginsConfigurationDirectories = this.getPluginsConfigurationDirectories(
      platformVersion
    ).sort((a, b) =>
      semver.rcompare(versionRe.exec(a)![1], versionRe.exec(b)![1])
    )

    for (const pluginsConfigurationDirectory of orderedPluginsConfigurationDirectories) {
      // Directory names cannot contain '/', so, replaced by ':'
      const pluginScopeAndName = plugin.basePath.replace(/\//g, ':')

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
