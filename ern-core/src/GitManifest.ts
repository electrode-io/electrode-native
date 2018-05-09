import { PackagePath } from './PackagePath'
import shell from './shell'
import gitCli from './gitCli'
import _ from 'lodash'
import fs from 'fs'
import path from 'path'
import semver from 'semver'
import Platform from './Platform'
import log from './log'

const manifestFileName = 'manifest.json'
const pluginConfigFileName = 'config.json'
const ERN_VERSION_DIRECTORY_RE = /ern_v(.+)\+/

export default class GitManifest {
  public readonly repoRemotePath: string
  public readonly remote: string
  public readonly branch: string
  private readonly git: any
  private readonly repoAbsoluteLocalPath: string
  private cachedManifest: any

  constructor(
    repoLocalPath: string,
    repoRemotePath: string,
    remote: string = 'origin',
    branch: string = 'master'
  ) {
    this.repoAbsoluteLocalPath = path.resolve(repoLocalPath)
    if (!fs.existsSync(this.repoAbsoluteLocalPath)) {
      shell.mkdir('-p', this.repoAbsoluteLocalPath)
    }
    this.git = gitCli(this.repoAbsoluteLocalPath)
    this.repoRemotePath = repoRemotePath
    this.remote = remote
    this.branch = branch
    this.cachedManifest = null
  }

  public async sync() {
    log.debug(`[GitManifest] Syncing ${this.repoRemotePath}`)

    if (!fs.existsSync(path.join(this.repoAbsoluteLocalPath, '.git'))) {
      log.debug(
        `[GitManifest] Creating local repository in ${
          this.repoAbsoluteLocalPath
        }`
      )
      shell.mkdir('-p', this.repoAbsoluteLocalPath)
      await this.git.initAsync()
      await this.git.addRemoteAsync(this.remote, this.repoRemotePath)
    }

    await this.git.rawAsync([
      'remote',
      'set-url',
      this.remote,
      this.repoRemotePath,
    ])

    try {
      log.debug(`[GitManifest] Fetching from ${this.remote} master`)
      await this.git.fetchAsync(this.remote, 'master')
    } catch (e) {
      if (e.message.includes(`Couldn't find remote ref master`)) {
        throw new Error(
          `It looks like no remote Manifest repository exist at ${
            this.repoRemotePath
          }`
        )
      } else {
        throw e
      }
    }

    await this.git.resetAsync(['--hard', `${this.remote}/master`])
    await this.git.pullAsync(this.remote, this.branch)
    const pathToManifestJson = path.join(
      this.repoAbsoluteLocalPath,
      manifestFileName
    )
    this.cachedManifest = JSON.parse(
      fs.readFileSync(pathToManifestJson, 'utf-8')
    )
  }

  // We only sync once during a whole "session" (in our context : "an ern command exection")
  // This is done to speed up things as during a single command execution, multiple manifest
  // access can be performed.
  // If you need to access a `Manifest` in a different context, a long session, you might
  // want to improve the code to act a bit smarter.
  public async syncIfNeeded() {
    if (!this.cachedManifest) {
      await this.sync()
    }
  }

  public async getManifest(): Promise<any> {
    await this.syncIfNeeded()
    return this.cachedManifest
  }

  public async getManifestData(platformVersion: string): Promise<any | void> {
    return _.find(await this.getManifest(), m =>
      semver.satisfies(platformVersion, m.platformVersion)
    )
  }

  //
  // Return an array containing all top level plugin configuration directories that
  // are matching an Electrode Native version lower or equal than the specified maxVersion
  // For example, given the following directories :
  //   /Users/blemair/.ern/ern-override-manifest/plugins/ern_v0.5.0+
  //   /Users/blemair/.ern/ern-override-manifest/plugins/ern_v0.10.0+
  //   /Users/blemair/.ern/ern-override-manifest/plugins/ern_v0.13.0+
  // And maxVersion = '0.10.0'
  // The function would return :
  // [
  //   '/Users/blemair/.ern/ern-override-manifest/plugins/ern_v0.5.0+',
  //   '/Users/blemair/.ern/ern-override-manifest/plugins/ern_v0.10.0+'
  // ]
  public getPluginsConfigurationDirectories(
    maxVersion: string = Platform.currentVersion
  ): string[] {
    return _(fs.readdirSync(path.join(this.repoAbsoluteLocalPath, 'plugins')))
      .filter(
        d =>
          ERN_VERSION_DIRECTORY_RE.test(d) &&
          semver.lte(ERN_VERSION_DIRECTORY_RE.exec(d)![1], maxVersion)
      )
      .map(d => path.join(this.repoAbsoluteLocalPath, 'plugins', d))
      .value()
  }

  public async getPluginConfigurationPath(
    plugin: PackagePath,
    platformVersion: string = Platform.currentVersion
  ): Promise<string | void> {
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

    // Top level plugin configuration directories ordered by descending
    // Electrode Native version
    // For example :
    // [
    //   '/Users/blemair/.ern/ern-override-manifest/plugins/ern_v0.10.0+',
    //   '/Users/blemair/.ern/ern-override-manifest/plugins/ern_v0.5.0+'
    // ]
    const orderedPluginsConfigurationDirectories = this.getPluginsConfigurationDirectories(
      platformVersion
    )
      .sort((a, b) =>
        semver.compare(versionRe.exec(a)![1], versionRe.exec(b)![1])
      )
      .reverse()

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
        .filter(f => f.startsWith(pluginName))

      const pluginVersions = _.map(
        pluginConfigDirectories,
        s => versionRe.exec(s)![1]
      )

      const matchingVersion = _.find(
        pluginVersions.sort(semver.compare).reverse(),
        d => semver.gte(plugin.version!, d)
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

  //
  // Old way of getting plugin configuration path
  // -- To be deprecated --
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
    )
      .sort((a, b) =>
        semver.compare(versionRe.exec(a)![1], versionRe.exec(b)![1])
      )
      .reverse()

    for (const pluginsConfigurationDirectory of orderedPluginsConfigurationDirectories) {
      // Directory names cannot contain '/', so, replaced by ':'
      const pluginScopeAndName = plugin.basePath.replace(/\//g, ':')

      const pluginVersions = _.map(
        fs
          .readdirSync(pluginsConfigurationDirectory)
          .filter(f => f.startsWith(pluginScopeAndName)),
        s => versionRe.exec(s)![1]
      )

      const matchingVersion = _.find(
        pluginVersions.sort(semver.compare).reverse(),
        d => semver.gte(plugin.version!, d)
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
