// @flow

import {
  Dependency
} from 'ern-util'
import Platform from './Platform'
import _ from 'lodash'
import fs from 'fs'
import Prom from 'bluebird'
import semver from 'semver'
import simpleGit from 'simple-git'

export default class GitManifest {
  _git: any
  _repoPath: string
  _cachedManifest: any
  _remote: string
  _branch: string

  constructor (
    repoPath: string,
    remote: string = 'origin',
    branch: string = 'master') {
    this._git = Prom.promisifyAll(simpleGit(repoPath))
    this._repoPath = repoPath
    this._remote = remote
    this._branch = branch
    this._cachedManifest = null
  }

  get repoPath () : string {
    return this._repoPath
  }

  get remote () : string {
    return this._remote
  }

  get branch () : string {
    return this._branch
  }

  async sync () {
    log.debug(`[GitManifest] Syncing ${this._repoPath}`)
    await this._git.pullAsync(this._remote, this._branch)
    this._cachedManifest = JSON.parse(fs.readFileSync(`${this._repoPath}/manifest.json`, 'utf-8'))
  }

  async getManifestData (platformVersion: string) : Promise<?Object> {
    if (!this._cachedManifest) {
      await this.sync()
    }
    return _.find(this._cachedManifest, m => semver.satisfies(platformVersion, m.platformVersion))
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
}
