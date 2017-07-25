// @flow

import {
    config
} from 'ern-util'
import {
  execSync
} from 'child_process'

import fs from 'fs'
import _ from 'lodash'

const HOME_DIRECTORY = process.env['HOME']
const ERN_VERSION_DIRECTORY_RE = /ern_v(.+)\+/

export default class Platform {
  static get rootDirectory () : string {
    if (!HOME_DIRECTORY) {
      throw new Error(`process.env['HOME'] is undefined !!!`)
    }
    return `${HOME_DIRECTORY}/.ern`
  }

  static get manifestDirectory () : string {
    return `${this.rootDirectory}/ern-master-manifest`
  }

  static get pluginsConfigurationDirectory () : string {
    const versions = _.map(
      fs.readdirSync(`${this.manifestDirectory}/plugins`),
        s => ERN_VERSION_DIRECTORY_RE.test(s)
          ? /ern_v(.+)\+/.exec(s)[1]
          : '')

    const matchingVersion = _.find(versions.sort().reverse(), d => this.currentVersion >= d)
    if (matchingVersion) {
      return `${this.manifestDirectory}/plugins/ern_v${matchingVersion}+`
    } else {
      throw new Error(`Plugins configuration directory was not found`)
    }
  }

  static get repositoryDirectory () : string {
    return `${this.rootDirectory}/ern-platform`
  }

  static get versionCacheDirectory () : string {
    return `${this.rootDirectory}/cache`
  }

  static get latestVersion () : string {
    return this.versions.slice(-1)[0]
  }

  static get currentPlatformVersionPath () : string {
    return this.getPlatformVersionPath(this.currentVersion)
  }

  static get currentVersion () : string {
    return config.getValue('platformVersion', '1000.0.0')
  }

  static get currentGitCommitSha () : string {
    return execSync(`git -C ${this.currentPlatformVersionPath} rev-parse HEAD`).slice(0, 7).toString()
  }

  static switchPlatformRepositoryToMaster () {
    execSync(`git -C ${this.repositoryDirectory} checkout master`)
  }

  static switchPlatformRepositoryToVersion (version: string) {
    execSync(`git -C ${this.repositoryDirectory} fetch origin --tags`)
    execSync(`git -C ${this.repositoryDirectory} checkout tags/v${version}`)
  }

  static isPlatformVersionAvailable (version: string) {
    return this.versions.includes('' + version)
  }

  static isPlatformVersionInstalled (version: string) {
    return fs.existsSync(this.getPlatformVersionPath(version))
  }

  static getPlatformVersionPath (version: string) {
    return `${this.versionCacheDirectory}/v${version}`
  }

  // Return an array of versions (ex: [1,2,3,4,5])
  // representing all the available versions of the platform
  // Doing this by looking at all remote branches of the platform
  // matching `vX` where x is a number.
  static get versions () : Array<string> {
    const branchVersionRe = /tags\/v(\d+.\d+.*\d*)/
    const versions = execSync(`git --git-dir ${this.repositoryDirectory}/.git ls-remote --tags`)
      .toString()
      .split('\n')
      .filter(v => branchVersionRe.test(v))

    return _.map(versions, v => branchVersionRe.exec(v)[1])
  }

  // Install a given platform version
  // If version is not installed yet and available it will just checkout
  // the version branch in the platform repository and call its install script
  static installPlatform (version: string) {
    if (this.isPlatformVersionInstalled(version)) {
      return log.warn(`Version ${version} of ern platform is already installed`)
    }

    if (!this.isPlatformVersionAvailable(version)) {
      throw new Error(`Version ${version} of ern platform is not available`)
    }

    this.switchPlatformRepositoryToVersion(version)

    require(`${this.repositoryDirectory}/install.js`).install()
  }

  // Uninstall a given platform version
  // If version is installed yet and not the currently activated version it will
  // just checkout the version branch in the platform repository and call its
  // uninstall script
  static uninstallPlatform (version: string) {
    if (!this.isPlatformVersionInstalled(version)) {
      return log.warn(`Version ${version} of ern platform is not installed`)
    }

    if (this.currentVersion === version) {
      return log.error(`Version ${version} is currently activated. Cannot uninstall`)
    }

    this.switchPlatformRepositoryToVersion(version)

    require(`${this.repositoryDirectory}/uninstall.js`).uninstall()
  }

  // Switch to / activate a given version
  // If the version is not installed yet, it will install it beforehand, then
  // it will just update the config file with new activated version number
  static switchToVersion (version: string) {
    if (version === this.currentVersion) {
      return log.info(`v${version} is already the version in use`)
    }

    if (!this.isPlatformVersionInstalled(version)) {
      log.info(`v${version} is not installed yet. Trying to install now`)
      this.installPlatform(version)
    }

    config.setValue('platformVersion', version)
    log.info(`v${version} is set as the current platform version`)
  }
}
