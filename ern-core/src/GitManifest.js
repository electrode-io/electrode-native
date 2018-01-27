// @flow

import PackagePath from './PackagePath'
import shell from './shell'
import gitCli from './gitCli'
import _ from 'lodash'
import fs from 'fs'
import path from 'path'
import semver from 'semver'
import Platform from './Platform'

const manifestFileName = 'manifest.json'
const pluginConfigFileName = 'config.json'
const ERN_VERSION_DIRECTORY_RE = /ern_v(.+)\+/

export default class GitManifest {
  _git: any
  _repoRemotePath: string
  _repoAbsoluteLocalPath: string
  _cachedManifest: any
  _remote: string
  _branch: string

  constructor (
    repoLocalPath: string,
    _repoRemotePath: string,
    remote: string = 'origin',
    branch: string = 'master') {
    this._repoAbsoluteLocalPath = path.resolve(repoLocalPath)
    if (!fs.existsSync(this._repoAbsoluteLocalPath)) {
      shell.mkdir('-p', this._repoAbsoluteLocalPath)
    }
    this._git = gitCli(this._repoAbsoluteLocalPath)
    this._repoRemotePath = _repoRemotePath
    this._remote = remote
    this._branch = branch
    this._cachedManifest = null
  }

  get localRepoPath () : string {
    return this._repoAbsoluteLocalPath
  }

  get remoteRepoPath () : string {
    return this._repoRemotePath
  }

  get remote () : string {
    return this._remote
  }

  get branch () : string {
    return this._branch
  }

  async sync () {
    log.debug(`[GitManifest] Syncing ${this._repoRemotePath}`)

    if (!fs.existsSync(path.join(this._repoAbsoluteLocalPath, '.git'))) {
      log.debug(`[GitManifest] Creating local repository in ${this._repoAbsoluteLocalPath}`)
      shell.mkdir('-p', this._repoAbsoluteLocalPath)
      await this._git.initAsync()
      await this._git.addRemoteAsync(this._remote, this._repoRemotePath)
    }

    await this._git.rawAsync([ 'remote', 'set-url', this._remote, this._repoRemotePath ])

    try {
      log.debug(`[GitManifest] Fetching from ${this._remote} master`)
      await this._git.fetchAsync(this._remote, 'master')
    } catch (e) {
      if (e.message.includes(`Couldn't find remote ref master`)) {
        throw new Error(`It looks like no remote Manifest repository exist at ${this._repoRemotePath}`)
      } else {
        throw e
      }
    }

    await this._git.resetAsync(['--hard', `${this._remote}/master`])
    await this._git.pullAsync(this._remote, this._branch)
    const pathToManifestJson = path.join(this._repoAbsoluteLocalPath, manifestFileName)
    this._cachedManifest = JSON.parse(fs.readFileSync(pathToManifestJson, 'utf-8'))
  }

  // We only sync once during a whole "session" (in our context : "an ern command exection")
  // This is done to speed up things as during a single command execution, multiple manifest
  // access can be performed.
  // If you need to access a `Manifest` in a different context, a long session, you might
  // want to improve the code to act a bit smarter.
  async syncIfNeeded () {
    if (!this._cachedManifest) {
      await this.sync()
    }
  }

  async getManifest () : Promise<Object> {
    await this.syncIfNeeded()
    return this._cachedManifest
  }

  async getManifestData (platformVersion: string) : Promise<?Object> {
    return _.find(await this.getManifest(), m => semver.satisfies(platformVersion, m.platformVersion))
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
  getPluginsConfigurationDirectories (maxVersion: string = Platform.currentVersion) : Array<string> {
    return _(fs.readdirSync(path.join(this._repoAbsoluteLocalPath, 'plugins')))
            .filter(d => ERN_VERSION_DIRECTORY_RE.test(d) && semver.lte(ERN_VERSION_DIRECTORY_RE.exec(d)[1], maxVersion))
            .map(d => path.join(this._repoAbsoluteLocalPath, 'plugins', d))
            .value()
  }

  async getPluginConfigurationPath (
    plugin: PackagePath,
    platformVersion: string = Platform.currentVersion) : Promise<?string> {
    let result = await this._getPluginConfigurationPath(plugin, platformVersion)
    if (!result) {
      result = await this._getPluginConfigurationPathLegacy(plugin, platformVersion)
    }
    return result
  }

  async _getPluginConfigurationPath (
    plugin: PackagePath,
    platformVersion: string = Platform.currentVersion) : Promise<?string> {
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
    const orderedPluginsConfigurationDirectories =
      this.getPluginsConfigurationDirectories(platformVersion)
          .sort((a, b) => semver.compare(versionRe.exec(a)[1], versionRe.exec(b)[1]))
          .reverse()

    for (const pluginsConfigurationDirectory of orderedPluginsConfigurationDirectories) {
      let pluginScope, pluginName, basePluginPath
      if (scopeNameRe.test(plugin.basePath)) {
        pluginScope = scopeNameRe.exec(plugin.basePath)[1]
        pluginName = scopeNameRe.exec(plugin.basePath)[2]
        basePluginPath = path.join(pluginsConfigurationDirectory, pluginScope)
      } else {
        pluginName = plugin.basePath
        basePluginPath = pluginsConfigurationDirectory
      }

      const pluginConfigDirectories = fs.readdirSync(basePluginPath).filter(f => f.startsWith(pluginName))

      const pluginVersions = _.map(
        pluginConfigDirectories,
        s => versionRe.exec(s)[1])

      const matchingVersion = _.find(pluginVersions.sort(semver.compare).reverse(), d => plugin.version >= d)
      if (matchingVersion) {
        let pluginConfigurationPath = ''
        pluginConfigurationPath = path.join(basePluginPath, `${pluginName}_v${matchingVersion}+`)
        if (fs.existsSync(path.join(pluginConfigurationPath, pluginConfigFileName))) {
          return pluginConfigurationPath
        }
      }
    }
  }

  //
  // Old way of getting plugin configuration path
  // -- To be deprecated --
  async _getPluginConfigurationPathLegacy (
    plugin: PackagePath,
    platformVersion: string = Platform.currentVersion) : Promise<?string> {
    await this.syncIfNeeded()
    const versionRe = /_v(.+)\+/
    const orderedPluginsConfigurationDirectories = this.getPluginsConfigurationDirectories(platformVersion)
                                                  .sort((a, b) => semver.compare(versionRe.exec(a)[1], versionRe.exec(b)[1]))
                                                  .reverse()

    for (const pluginsConfigurationDirectory of orderedPluginsConfigurationDirectories) {
      // Directory names cannot contain '/', so, replaced by ':'
      const pluginScopeAndName = plugin.basePath.replace(/\//g, ':')

      const pluginVersions = _.map(
        fs.readdirSync(pluginsConfigurationDirectory).filter(f => f.startsWith(pluginScopeAndName)),
        s => versionRe.exec(s)[1])

      const matchingVersion = _.find(pluginVersions.sort(semver.compare).reverse(), d => plugin.version >= d)
      if (matchingVersion) {
        const pluginConfigurationPath = path.join(pluginsConfigurationDirectory, `${pluginScopeAndName}_v${matchingVersion}+`)
        if (fs.existsSync(path.join(pluginConfigurationPath, pluginConfigFileName))) {
          return pluginConfigurationPath
        }
      }
    }
  }
}
