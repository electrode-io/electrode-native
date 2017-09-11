// @flow

import {
  Dependency
} from 'ern-util'
import _ from 'lodash'
import fs from 'fs'
import path from 'path'
import Prom from 'bluebird'
import semver from 'semver'
import shell from 'shelljs'
import simpleGit from 'simple-git'
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
    let simpleGitInstance = simpleGit(this._repoAbsoluteLocalPath)
    simpleGitInstance.silent(global.ernLogLevel === 'trace' || global.ernLogLevel === 'debug')
    this._git = Prom.promisifyAll(simpleGitInstance)
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

  getPluginsConfigurationDirectories (maxVersion: string = Platform.currentVersion) : Array<string> {
    return _(fs.readdirSync(path.join(this._repoAbsoluteLocalPath, 'plugins')))
            .filter(d => ERN_VERSION_DIRECTORY_RE.test(d) && ERN_VERSION_DIRECTORY_RE.exec(d)[1] <= maxVersion)
            .map(d => `${this._repoAbsoluteLocalPath}/plugins/${d}`)
            .value()
  }

  async getPluginConfigurationPath (
    plugin: Dependency,
    platformVersion: string = Platform.currentVersion) : Promise<?string> {
    await this.syncIfNeeded()
    const orderedPluginsConfigurationDirectories = _(this.getPluginsConfigurationDirectories(platformVersion))
                                                  .sortBy()
                                                  .reverse()
                                                  .value()

    for (const pluginsConfigurationDirectory of orderedPluginsConfigurationDirectories) {
      // Directory names cannot contain '/', so, replaced by ':'
      const pluginScopeAndName = plugin.scopedName.replace(/\//g, ':')

      const pluginVersions = _.map(
        fs.readdirSync(pluginsConfigurationDirectory).filter(f => f.startsWith(pluginScopeAndName)),
        s => /_v(.+)\+/.exec(s)[1])

      const matchingVersion = _.find(pluginVersions.sort().reverse(), d => plugin.version >= d)
      if (matchingVersion) {
        const pluginConfigurationPath = `${pluginsConfigurationDirectory}/${pluginScopeAndName}_v${matchingVersion}+`
        if (fs.existsSync(`${pluginConfigurationPath}/${pluginConfigFileName}`)) {
          return pluginConfigurationPath
        }
      }
    }
  }
}
