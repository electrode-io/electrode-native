import config from './config';
import shell from './shell';
import log from './log';
import { NativePlatform } from './NativePlatform';
import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import semver from 'semver';

const ROOT_DIRECTORY = () =>
  process.env.ERN_HOME || path.join(os.homedir(), '.ern');
// Name of ern local client NPM package
const ERN_LOCAL_CLI_PACKAGE = 'ern-local-cli';

export default class Platform {
  static get rootDirectory(): string {
    return ROOT_DIRECTORY();
  }

  static get packagesCacheDirectory(): string {
    return path.join(this.rootDirectory, 'packages-cache');
  }

  static get cauldronDirectory(): string {
    return path.join(this.rootDirectory, 'cauldron');
  }

  static get localCauldronsDirectory(): string {
    return path.join(this.rootDirectory, 'local-cauldrons');
  }

  static get masterManifestDirectory(): string {
    return path.join(this.rootDirectory, 'ern-master-manifest');
  }

  static get overrideManifestDirectory(): string {
    return path.join(this.rootDirectory, 'ern-override-manifest');
  }

  static get versionCacheDirectory(): string {
    return path.join(this.rootDirectory, 'versions');
  }

  static get containerPublishersCacheDirectory(): string {
    return path.join(this.rootDirectory, 'container-publishers-cache');
  }

  static get containerTransformersCacheDirectory(): string {
    return path.join(this.rootDirectory, 'container-transformers-cache');
  }

  static get containerGenDirectory(): string {
    return path.join(this.rootDirectory, 'containergen');
  }

  public static getContainerGenOutDirectory(platform: NativePlatform): string {
    return path.join(this.containerGenDirectory, 'out', platform);
  }

  static get latestVersion(): string {
    return this.versions.slice(-1)[0];
  }

  static get currentPlatformVersionPath(): string {
    return this.getPlatformVersionPath(this.currentVersion);
  }

  static get currentVersion(): string {
    return config.get('platformVersion', '1000.0.0');
  }

  public static isPlatformVersionAvailable(version: string) {
    return this.versions.includes('' + version);
  }

  public static getRootPlatformVersionPath(version: string) {
    return path.join(this.versionCacheDirectory, version);
  }

  public static isPlatformVersionInstalled(version: string) {
    return fs.pathExistsSync(this.getRootPlatformVersionPath(version));
  }

  public static getPlatformVersionPath(version: string) {
    return version === '1000.0.0'
      ? path.join(this.versionCacheDirectory, version)
      : path.join(this.versionCacheDirectory, version, 'node_modules');
  }

  // Return an array of versions (ex: [1,2,3,4,5])
  // representing all the available versions of the platform local cli
  public static get versions(): string[] {
    return JSON.parse(
      execSync(`npm info ${ERN_LOCAL_CLI_PACKAGE} versions --json`).toString(),
    ).sort(semver.compare);
  }

  // Install a given platform version
  public static installPlatform(version: string) {
    version = this.normalizeVersion(version);
    if (this.isPlatformVersionInstalled(version)) {
      return log.warn(
        `Version ${version} of ern platform is already installed`,
      );
    }

    if (!this.isPlatformVersionAvailable(version)) {
      throw new Error(`Version ${version} of ern platform is not available`);
    }

    const pathToVersion = this.getRootPlatformVersionPath(version);

    try {
      shell.mkdir(pathToVersion);
      shell.pushd(pathToVersion);
      if (this.isYarnInstalled()) {
        // Favor yarn if it is installed as it will greatly speed up install
        execSync(`yarn init --yes`, { cwd: pathToVersion });
        execSync(
          `yarn add ${ERN_LOCAL_CLI_PACKAGE}@${version} --exact --ignore-engines`,
          {
            cwd: pathToVersion,
          },
        );
      } else {
        execSync(`npm init --yes`, { cwd: pathToVersion });
        execSync(`npm install ${ERN_LOCAL_CLI_PACKAGE}@${version} --exact`, {
          cwd: pathToVersion,
        });
      }
    } catch (e) {
      log.error(
        'Something went wrong during installation. Performing clean up.',
      );
      shell.rm('-rf', pathToVersion);
      throw e;
    } finally {
      shell.popd();
    }
  }

  // Uninstall a given platform version
  public static uninstallPlatform(version: string) {
    if (!this.isPlatformVersionInstalled(version)) {
      return log.warn(`Version ${version} of ern platform is not installed`);
    }

    if (this.currentVersion === version) {
      return log.error(
        `Version ${version} is currently activated. Cannot uninstall`,
      );
    }

    shell.rm('-rf', this.getRootPlatformVersionPath(version));
  }

  // Switch to / activate a given version
  // If the version is not installed yet, it will install it beforehand, then
  // it will just update the config file with new activated version number
  public static switchToVersion(version: string) {
    version = this.normalizeVersion(version);
    if (version === this.currentVersion) {
      return log.info(`Already using ern v${version}`);
    }

    if (!this.isPlatformVersionInstalled(version)) {
      if (!this.isPlatformVersionAvailable(version)) {
        throw new Error(`Version ${version} of ern platform is not available`);
      }
      log.info(`ern v${version} is not installed yet. Installing now.`);
      this.installPlatform(version);
    }

    config.set('platformVersion', version);
    log.info(`ern v${version} is now activated.`);
  }

  public static normalizeVersion(version: string) {
    let result;
    if (version === 'latest') {
      result = Platform.versions.pop()!;
    } else {
      result = semver.valid(version);
      if (!result) {
        throw new Error(`Cannot normalize invalid version : ${version}`);
      }
    }
    return result;
  }

  public static isYarnInstalled() {
    try {
      if (process.platform === 'win32') {
        execSync('yarn --version > NUL 2>&1');
      } else {
        execSync('yarn --version 1>/dev/null 2>/dev/null');
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  public static isCocoaPodsInstalled() {
    try {
      execSync('pod --version 1>/dev/null 2>/dev/null');
      return true;
    } catch (e) {
      return false;
    }
  }
}
