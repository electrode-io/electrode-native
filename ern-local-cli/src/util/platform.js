import child_process from 'child_process';
const execSync = child_process.execSync;
import fs from 'fs';
import _ from 'lodash';
import config from './config.js';

const ERN_GIT_REPO_URL = `git@gecgithub01.walmart.com:Electrode-Mobile-Platform/ern-platform.git`;
const ERN_PATH = `${process.env['HOME']}/.ern`;
const ERN_PLATFORM_REPO_PATH = `${ERN_PATH}/ern-platform`;
const ERN_VERSIONS_CACHE_PATH = `${ERN_PATH}/cache`;

class Platform {
  switchPlatformRepositoryToMaster() {
    execSync(`git -C ${ERN_PLATFORM_REPO_PATH} checkout master`);
  }

  switchPlatformRepositoryToVersion(version) {
    execSync(`git -C ${ERN_PLATFORM_REPO_PATH} checkout origin/v${version}`);
  }

  isPlatformVersionAvailable(version) {
    return this.versions.includes(version);
  }

  isPlatformVersionInstalled(version) {
    return fs.existsSync(this.getPlatformVersionPath(version));
  }

  getPlatformVersionPath(version) {
    return `${ERN_VERSIONS_CACHE_PATH}/v${version}`;
  }

  get latestVersion() {
    return this.versions.slice(-1)[0];
  }

  get currentPlatformVersionPath() {
    return this.getPlatformVersionPath(this.currentVersion);
  }

  get currentVersion() {
    return config.getValue('platformVersion');
  }

  // Return an array of versions (ex: [1,2,3,4,5])
  // representing all the available versions of the platform
  // Doing this by looking at all remote branches of the platform
  // matching `vX` where x is a number.
  get versions() {
    const branchVersionRe = /heads\/v(\d+)/;
    const versions = execSync(`git --git-dir ${ERN_PLATFORM_REPO_PATH}/.git ls-remote --heads`)
      .toString()
      .split('\n')
      .filter(v => branchVersionRe.test(v));

    return _.map(versions, v => branchVersionRe.exec(v)[1]);
  }

  // Install a given platform version
  // If version is not installed yet and available it will just checkout
  // the version branch in the platform repository and call its install script
  installPlatform(version) {
    if (this.isPlatformVersionInstalled(version)) {
      return log.warn(`Version ${version} of ern platform is already installed`);
    }

    if (!this.isPlatformVersionAvailable(version)) {
      throw new Error(`Version ${version} of ern platform is not available`)
    }

    this.switchPlatformRepositoryToVersion(version);

    require(`${ERN_PLATFORM_REPO_PATH}/install.js`).install();
  }

  // Uninstall a given platform version
  // If version is installed yet and not the currently activated version it will
  // just checkout the version branch in the platform repository and call its
  // uninstall script
  uninstallPlatform(version) {
    if (!this.isPlatformVersionInstalled(version)) {
      return log.warn(`Version ${version} of ern platform is not installed`);
    }

    if (this.currentVersion === version) {
      return log.error(`Version ${version} is currently activated. Cannot uninstall`)
    }

    this.switchPlatformRepositoryToVersion(version);

    require(`${ERN_PLATFORM_REPO_PATH}/uninstall.js`).uninstall();
  }

  // Switch to / activate a given version
  // If the version is not installed yet, it will install it beforehand, then
  // it will just update the config file with new activated version number
  switchToVersion(version) {
    if (version === this.currentVersion) {
      return log.info(`v${version} is already the version in use`);
    }

    if (!this.isPlatformVersionInstalled(version)) {
      log.info(`v${version} is not installed yet. Trying to install now`);
      this.installPlatform(version);
    }

    config.setValue('platformVersion', version);
  }

  get currentVersionManifest() {
    return JSON.parse(fs.readFileSync(`${this.currentPlatformVersionPath}/manifest.json`, 'utf-8'));
  }

  get repositoryManifest() {
    return JSON.parse(fs.readFileSync(`${ERN_PLATFORM_REPO_PATH}/manifest.json`, 'utf-8'));
  }

  // Given a string representing the plugin, explode it into an object
  // Valid input strings samples :
  // react-native
  // react-native@0.40
  // @walmart/react-native
  // @walmart/react-native@0.40
  buildPluginObj(pluginString) {
    const scopedModuleWithVersionRe = /@(.+)\/(.+)@(.+)/;
    const unscopedModuleWithVersionRe = /(.+)@(.+)/;
    const scopedModuleWithoutVersionRe = /@(.+)\/(.+)/;

    if (scopedModuleWithVersionRe.test(pluginString)) {
      return {
        scope: scopedModuleWithVersionRe.exec(pluginString)[1],
        name: scopedModuleWithVersionRe.exec(pluginString)[2],
        version: scopedModuleWithVersionRe.exec(pluginString)[3]
      }
    } else if (unscopedModuleWithVersionRe.test(pluginString)) {
      return {
        name: unscopedModuleWithVersionRe.exec(pluginString)[1],
        version: unscopedModuleWithVersionRe.exec(pluginString)[2]
      }
    } else if (scopedModuleWithoutVersionRe.test(pluginString)) {
      return {
        scope: scopedModuleWithoutVersionRe.exec(pluginString)[1],
        name: scopedModuleWithoutVersionRe.exec(pluginString)[2]
      }
    } else {
      return { name: pluginString }
    }
  }

  // Returns the list of supported plugins for a given platform version
  // If version is currently activated one, it just looks in the current
  // version manifest.
  // Otherwise it just switch the platform repository to the given version branch
  // and then build the array based on the manifest
  getSupportedPlugins(version) {
    let manifest;
    if (version === this.currentVersion) {
      manifest = this.currentVersionManifest;
    } else {
      if (!this.isPlatformVersionAvailable(version)) {
        throw new Error(`Version ${version} does not exists`);
      }
      this.switchPlatformRepositoryToVersion(version);
      manifest = this.repositoryManifest;
    }

    return _.map(manifest.supportedPlugins, d => this.buildPluginObj(d));
  }

  getPlugin(pluginString) {
    const plugin = this.buildPluginObj(pluginString);
    return _.find(this.getSupportedPlugins(this.currentVersion),
      d => (d.name === plugin.name) && (d.scope === plugin.scope));
  }
}

export default new Platform();
