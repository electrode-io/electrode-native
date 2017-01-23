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

  get versions() {
    const branchVersionRe = /heads\/v(\d+)/;
    const versions = execSync(`git --git-dir ${ERN_PLATFORM_REPO_PATH}/.git ls-remote --heads`)
      .toString()
      .split('\n')
      .filter(v => branchVersionRe.test(v));

    return _.map(versions, v => branchVersionRe.exec(v)[1]);
  }

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

  get manifest() {
    return require(`${this.getPlatformVersionPath(this.currentVersion)}/manifest.json`);
  }

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

  getSupportedPlugins(version) {
    let versionBeforeSwitch;
    if (version && (version !== this.currentVersion)) {
      versionBeforeSwitch = this.currentVersion;
      this.switchToVersion(version);
    }

    const result = _.map(this.manifest.supportedPlugins, d => this.buildPluginObj(d));

    if (versionBeforeSwitch) {
      this.switchToVersion(versionBeforeSwitch);
    }

    return result;
  }

  getPlugin(pluginString) {
    const plugin = this.buildPluginObj(pluginString);
    return _.find(this.getSupportedPlugins(),
      d => (d.name === plugin.name) && (d.scope === plugin.scope));
  }
}

export default new Platform();
