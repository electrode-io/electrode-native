import child_process from 'child_process';
const execSync = child_process.execSync;
import fs from 'fs';
import _ from 'lodash';
import { logInfo, logWarn, logError } from './log.js';
import config from './config.js';

const ERN_GIT_REPO_URL = `git@gecgithub01.walmart.com:Electrode-Mobile-Platform/ern-platform.git`;
const ERN_PATH = `${process.env['HOME']}/.ern`;
const ERN_PLATFORM_REPO_PATH = `${ERN_PATH}/ern-platform`;
const ERN_VERSIONS_CACHE_PATH = `${ERN_PATH}/cache`;

const moduleRe = /(.*)@(.*)/;

class Platform {
  updatePlatformRepository() {
    this.switchPlatformRepositoryToMaster();
    execSync(`git --git-dir ${ERN_PLATFORM_REPO_PATH}/.git pull`);
  }

  switchPlatformRepositoryToMaster() {
    execSync(`git -C ${ERN_PLATFORM_REPO_PATH} checkout master`);
  }

  isPlatformVersionInstalled(version) {
    return fs.existsSync(this.getPlatformVersionPath(version));
  }

  getPlatformVersionPath(version) {
    return `${ERN_VERSIONS_CACHE_PATH}/v${version}`;
  }

  get currentPlatformVersionPath() {
    return this.getPlatformVersionPath(this.currentVersion);
  }

  installPlatform(version) {
    if (this.isPlatformVersionInstalled(version)) {
      return logWarn(`Version ${version} of ern platform is already installed`);
    }

    if (!this.isPlatformVersionAvailable(version)) {
      // Requested platform version is not available
      // Let's make sure first that repo is up to date ...
      this.updatePlatformRepository();

      // .. then recheck
      if (!this.isPlatformVersionAvailable(version)) {
        throw new Error(`Version ${version} of ern platform is not available`)
      }
    }

    this.switchPlatformRepositoryToVersion(version);

    require(`${ERN_PLATFORM_REPO_PATH}/install.js`).install();
  }

  //
  // Uninstall a specific version of the platform
  uninstallPlatform(version) {
    if (!this.isPlatformVersionInstalled(version)) {
      return logWarn(`Version ${version} of ern platform is not installed`);
    }

    if (this.currentVersion === version) {
      return logError(`Version ${version} is currently activated. Cannot uninstall`)
    }

    this.switchPlatformRepositoryToVersion(version);

    require(`${ERN_PLATFORM_REPO_PATH}/uninstall.js`).uninstall();
  }

  switchPlatformRepositoryToVersion(version) {
    execSync(`git -C ${ERN_PLATFORM_REPO_PATH} checkout v${version}`);
  }

  isPlatformVersionAvailable(version) {
    return this.versions.includes(version);
  }

  get latestVersion() {
    return this.versions.slice(-1)[0];
  }

  get versions() {
    const versions = execSync(`git --git-dir ${ERN_PLATFORM_REPO_PATH}/.git tag`)
      .toString()
      .split('\n')
      .filter(String)
    const versionsWithoutPrefix = _.map(versions, v => v.replace('v',''));
    return _.map(versionsWithoutPrefix, v => v.replace('.0', '')); // temp hack
  }

  get currentVersion() {
    return config.getValue('platformVersion');
  }

  switchToVersion(version) {
    if (version === this.currentVersion) {
      return logInfo(`v${version} is already the version in use`);
    }

    if (!this.isPlatformVersionInstalled(version)) {
      logInfo(`v${version} is not installed yet. Trying to install now`);
      this.installPlatform(version);
    }

    config.setValue('platformVersion', version);
  }

  get manifest() {
    return require(`${this.getPlatformVersionPath(this.currentVersion)}/manifest.json`);
  }

  getSupportedPlugins(version) {
    let versionBeforeSwitch;
    if (version && (version !== this.currentVersion)) {
      versionBeforeSwitch = this.currentVersion;
      this.switchToVersion(version);
    }

    const result = _.map(this.manifest.supportedPlugins, (d) => ({
                    name: moduleRe.exec(d)[1],
                    version: moduleRe.exec(d)[2]
                  }));

    if (versionBeforeSwitch) {
      this.switchToVersion(versionBeforeSwitch);
    }

    return result;
  }

  getDependency(name) {
    return _.find(this.getSupportedPlugins(), d => d.name === name);
  }
}

export default new Platform();
