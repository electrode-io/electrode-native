// @flow

import {
  Platform
} from '@walmart/ern-core'
import {
    Dependency
} from '@walmart/ern-util'
import cauldron from './cauldron'
import Prom from 'bluebird'
import _ from 'lodash'
import fs from 'fs'
import semver from 'semver'
import simpleGit from 'simple-git'
const git = Prom.promisifyAll(simpleGit(Platform.manifestDirectory))

const npmModuleRe = /(.*)@(.*)/

export default class Manifest {
  //
  // Manifest access
  //

  // Gets the manifest of a given platform version
  static async getManifest (version) : Promise<?Object> {
    let manifest

    if (this.hasLocalManifest(version) && (Platform.currentVersion === version)) {
      manifest = this.getLocalManifest(version)
    }

    if ((!manifest) && (await this.hasCauldronManifest(version))) {
      manifest = await this.getCauldronManifest(version)
    }

    if ((!manifest) && (this.hasMasterManifest(version))) {
      manifest = await this.getMasterManifest(version)
    }

    return manifest
  }

  // Gets the merged manifest of a given platform version
  static async getMergedManifest (version) : Promise<?Object> {
    let mergedManifest = {}

    const localManifest = this.getLocalManifest(version)
    const cauldronManifest = await this.getCauldronManifest(version)
    const masterManifest = await this.getMasterManifest(version)

    mergedManifest.targetNativeDependencies = _.unionBy(
      localManifest ? localManifest.targetNativeDependencies : [],
      cauldronManifest ? cauldronManifest.targetNativeDependencies : [],
      masterManifest ? masterManifest.targetNativeDependencies : [],
      d => Dependency.fromString(d).withoutVersion().toString())

    mergedManifest.targetJsDependencies = _.unionBy(
      localManifest ? localManifest.targetJsDependencies : [],
      cauldronManifest ? cauldronManifest.targetJsDependencies : [],
      masterManifest ? masterManifest.targetJsDependencies : [],
      d => Dependency.fromString(d).withoutVersion().toString())

    return mergedManifest
  }

  // Is there a local manifest for a given platform version ?
  static hasLocalManifest (version: string) : boolean {
    return fs.existsSync(`${Platform.getPlatformVersionPath(version)}/manifest.json`)
  }

  // Gets the local manifest of a given platform version
  static getLocalManifest (version: string) : ?Object {
    if (this.hasLocalManifest(version)) {
      return JSON.parse(fs.readFileSync(`${Platform.getPlatformVersionPath(version)}/manifest.json`, 'utf-8'))
    }
  }

  // Is there a manifest in current Cauldron for a given platform version ?
  static async hasCauldronManifest (version: string) : Promise<boolean> {
    return this.getCauldronManifest(version) !== undefined
  }

  // Gets the manifest of a given platform version from the Cauldron
  static async getCauldronManifest (version: string) : Promise<?Object> {
    const manifests = await cauldron.getManifests()
    return _.find(manifests, m => semver.satisfies(version, m.platformVersion))
  }

  // Is there an official master manifest for a given platform version ?
  static async hasMasterManifest (version: string) : Promise<boolean> {
    return this.getMasterManifest(version) !== undefined
  }

  // Gets the offical master manifest of a given platform version
  static async getMasterManifest (version: string) : Promise<?Object> {
    return _.find(await this.getMasterManifests(), m => semver.satisfies(version, m.platformVersion))
  }

  // Get the offical master manifests
  static async getMasterManifests () : Promise<Array<Object>> {
    let result = []
    if (git) {
      await git.pullAsync('origin', 'master')
      result = JSON.parse(fs.readFileSync(`${Platform.manifestDirectory}/manifest.json`, 'utf-8'))
    }
    return result
  }

  //
  // Manifest data access
  //

  static async getTargetNativeDependencies (version: string) : Promise<Array<Dependency>> {
    const manifest = await this.getMergedManifest(version)
    return manifest
      ? _.map(manifest.targetNativeDependencies, d => Dependency.fromString(d))
      : []
  }

  static async getTargetJsDependencies (version: string) : Promise<Array<Dependency>> {
    const manifest = await this.getMergedManifest(version)
    return manifest
      ? _.map(manifest.targetJsDependencies, d => Dependency.fromString(d))
      : []
  }

  static async getTargetNativeAndJsDependencies (version: string) : Promise<Array<Dependency>> {
    const manifest = await this.getMergedManifest(version)
    const manifestDeps = manifest
      ? _.union(manifest.targetJsDependencies, manifest.targetNativeDependencies)
      : []
    return _.map(manifestDeps, d => Dependency.fromString(d))
  }

  static async getPlugin (pluginString: string) : Promise<?Dependency> {
    const plugin = Dependency.fromString(pluginString)
    return _.find(await this.getTargetNativeDependencies(Platform.currentVersion),
      d => (d.name === plugin.name) && (d.scope === plugin.scope))
  }

  static async getTargetNativeDependency (platformVersion: string, dependency: Dependency) : Promise<?Dependency> {
    const targetNativeDependencies = await this.getTargetNativeDependencies(platformVersion)
    return _.find(targetNativeDependencies, d => (d.name === dependency.name) && (d.scope === dependency.scope))
  }

  static async getJsDependency (dependencyString: string) : Promise<?Dependency> {
    const jsDependency = Dependency.fromString(dependencyString)
    return _.find(await this.getTargetJsDependencies(Platform.currentVersion),
      d => (d.name === jsDependency.name) && (d.scope === jsDependency.scope))
  }

  static async getDependency (dependencyString: string) : Promise<?Dependency> {
    const dependency = Dependency.fromString(dependencyString)
    return _.find(await this.getTargetNativeAndJsDependencies(Platform.currentVersion),
      d => (d.name === dependency.name) && (d.scope === dependency.scope))
  }

  static async getReactNativeVersionFromManifest (platformVersion?: string = Platform.currentVersion) : Promise<?string> {
    const reactNativeDependencyFromManifest = await this.getReactNativeDependencyFromManifest(platformVersion)
    if (reactNativeDependencyFromManifest) {
      return npmModuleRe.exec(reactNativeDependencyFromManifest)[2]
    }
  }

  static async getReactNativeDependencyFromManifest (platformVersion?: string = Platform.currentVersion) : Promise<?string> {
    const currentVersionManifest = await this.getMergedManifest(platformVersion)
    return currentVersionManifest
      ? _.find(currentVersionManifest.targetNativeDependencies, d => d.startsWith('react-native@'))
      : undefined
  }
}
