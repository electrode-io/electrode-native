import * as schemas from './schemas';
import {
  AnyAppDescriptor,
  AppNameDescriptor,
  AppPlatformDescriptor,
  AppVersionDescriptor,
  PackagePath,
} from 'ern-core';
import { exists, joiValidate, normalizeCauldronFilePath } from './util';
import _ from 'lodash';
import {
  Cauldron,
  CauldronCodePushEntry,
  CauldronConfigLevel,
  CauldronNativeApp,
  CauldronNativeAppPlatform,
  CauldronNativeAppVersion,
  CauldronObject,
  ICauldronDocumentStore,
  ICauldronFileStore,
} from './types';
import upgradeScripts from './upgrade-scripts/scripts';
import path from 'path';
import uuidv4 from 'uuid/v4';
import semver from 'semver';

const yarnLocksStoreDirectory = 'yarnlocks';
const bundlesStoreDirectory = 'bundles';

export type ContainerJsPackagesBranchesArrayKey =
  | 'jsApiImplsBranches'
  | 'miniAppsBranches';

export type ContainerJsPackagesVersionsArrayKey = 'jsApiImpls' | 'miniApps';

export type ContainerJsPackagesArrayKey =
  | ContainerJsPackagesBranchesArrayKey
  | ContainerJsPackagesVersionsArrayKey;

export type ContainerPackagesArrayKey =
  | ContainerJsPackagesArrayKey
  | 'nativeDeps';

export default class CauldronApi {
  private readonly documentStore: ICauldronDocumentStore;
  private readonly fileStore: ICauldronFileStore;

  constructor(
    documentStore: ICauldronDocumentStore,
    fileStore: ICauldronFileStore,
  ) {
    this.documentStore = documentStore;
    this.fileStore = fileStore;
  }

  public async commit(message: string): Promise<void> {
    return this.documentStore.commit(message);
  }

  public async getCauldron(): Promise<Cauldron> {
    return this.documentStore.getCauldron();
  }

  // =====================================================================================
  // CAULDRON SCHEMA UPGRADE
  // =====================================================================================

  public async upgradeCauldronSchema(): Promise<void> {
    let currentSchemaVersion = await this.getCauldronSchemaVersion();
    if (currentSchemaVersion === schemas.schemaVersion) {
      throw new Error(
        `The Cauldron is already using the proper schema version ${currentSchemaVersion}`,
      );
    }
    let isUpgradeStarted = false;
    // We apply all upgrade scripts, one by one, starting from the current schema version
    for (const upgradeScript of upgradeScripts) {
      if (upgradeScript.from === currentSchemaVersion) {
        isUpgradeStarted = true;
      }
      if (isUpgradeStarted) {
        await upgradeScript.upgrade(this);
        currentSchemaVersion = upgradeScript.to;
      }
    }
  }

  // =====================================================================================
  // TRANSACTION MANAGEMENT
  // =====================================================================================

  public async beginTransaction(): Promise<void> {
    await this.documentStore.beginTransaction();
    await this.fileStore.beginTransaction();
  }

  public async discardTransaction(): Promise<void> {
    await this.documentStore.discardTransaction();
    await this.fileStore.discardTransaction();
  }

  public async commitTransaction(message: string | string[]): Promise<void> {
    await this.documentStore.commitTransaction(message);
    await this.fileStore.commitTransaction(message);
  }

  // =====================================================================================
  // READ OPERATIONS
  // =====================================================================================

  public async getCauldronSchemaVersion(): Promise<string> {
    const cauldron = await this.getCauldron();
    return cauldron.schemaVersion || '0.0.0';
  }

  public async getDescriptor(
    descriptor: AnyAppDescriptor,
  ): Promise<
    CauldronNativeApp | CauldronNativeAppPlatform | CauldronNativeAppVersion
  > {
    return descriptor instanceof AppVersionDescriptor
      ? this.getVersion(descriptor)
      : descriptor instanceof AppPlatformDescriptor
      ? this.getPlatform(descriptor)
      : this.getNativeApplication(descriptor);
  }

  public async getNativeApplications(): Promise<CauldronNativeApp[]> {
    const cauldron = await this.getCauldron();
    return cauldron.nativeApps;
  }

  public async hasDescriptor(descriptor: AnyAppDescriptor): Promise<boolean> {
    return descriptor instanceof AppVersionDescriptor
      ? this.hasVersion(descriptor)
      : descriptor instanceof AppPlatformDescriptor
      ? this.hasPlatform(descriptor)
      : this.hasNativeApplication(descriptor);
  }

  public async hasNativeApplication(
    descriptor: AnyAppDescriptor,
  ): Promise<boolean> {
    const cauldron = await this.getCauldron();
    const result = _.find(
      cauldron.nativeApps,
      (n) => n.name === descriptor.name,
    );
    return result != null;
  }

  public async hasPlatform(
    descriptor: AppPlatformDescriptor | AppVersionDescriptor,
  ): Promise<boolean> {
    if (!(await this.hasNativeApplication(descriptor))) {
      return false;
    }
    const platforms = await this.getPlatforms(descriptor);
    const result = _.find(platforms, (p) => p.name === descriptor.platform);
    return result != null;
  }

  public async hasVersion(descriptor: AppVersionDescriptor): Promise<boolean> {
    if (!(await this.hasPlatform(descriptor))) {
      return false;
    }
    const versions = await this.getVersions(descriptor);
    const result = _.find(versions, (v) => v.name === descriptor.version);
    return result != null;
  }

  public async getNativeApplication(
    descriptor: AnyAppDescriptor,
  ): Promise<CauldronNativeApp> {
    const cauldron = await this.getCauldron();
    const result = _.find(
      cauldron.nativeApps,
      (n) => n.name === descriptor.name,
    );
    if (!result) {
      throw new Error(`Cannot find ${descriptor.toString()} in Cauldron`);
    }
    return result;
  }

  public async getPlatforms(
    descriptor: AnyAppDescriptor,
  ): Promise<CauldronNativeAppPlatform[]> {
    const app = await this.getNativeApplication(descriptor);
    return app.platforms;
  }

  public async getPlatform(
    descriptor: AppPlatformDescriptor | AppVersionDescriptor,
  ): Promise<CauldronNativeAppPlatform> {
    const platforms = await this.getPlatforms(descriptor);
    const result = _.find(platforms, (p) => p.name === descriptor.platform);
    if (!result) {
      throw new Error(`Cannot find ${descriptor.toString()} in Cauldron`);
    }
    return result;
  }

  public async getVersions(
    descriptor: AppPlatformDescriptor | AppVersionDescriptor,
  ): Promise<CauldronNativeAppVersion[]> {
    const platform = await this.getPlatform(descriptor);
    return platform.versions;
  }

  public async getVersion(
    descriptor: AppVersionDescriptor,
  ): Promise<CauldronNativeAppVersion> {
    const versions = await this.getVersions(descriptor);
    const result = _.find(versions, (v) => v.name === descriptor.version);
    if (!result) {
      throw new Error(`Cannot find ${descriptor.toString()} in Cauldron`);
    }
    return result;
  }

  public async getCodePushEntries(
    descriptor: AppVersionDescriptor,
  ): Promise<{ [deploymentName: string]: CauldronCodePushEntry[] }>;
  public async getCodePushEntries(
    descriptor: AppVersionDescriptor,
    deploymentName: string,
  ): Promise<CauldronCodePushEntry[]>;
  public async getCodePushEntries(
    descriptor: AppVersionDescriptor,
    deploymentName?: string,
  ): Promise<
    | { [deploymentName: string]: CauldronCodePushEntry[] }
    | CauldronCodePushEntry[]
  > {
    const version = await this.getVersion(descriptor);
    return deploymentName ? version.codePush[deploymentName] : version.codePush;
  }

  public async getContainerMiniApps(
    descriptor: AppVersionDescriptor,
  ): Promise<string[]> {
    const version = await this.getVersion(descriptor);
    return version.container.miniApps;
  }

  public async getContainerMiniAppsBranches(
    descriptor: AppVersionDescriptor,
  ): Promise<string[]> {
    const version = await this.getVersion(descriptor);
    return version.container.miniAppsBranches || [];
  }

  public async getContainerJsApiImplsBranches(
    descriptor: AppVersionDescriptor,
  ): Promise<string[]> {
    const version = await this.getVersion(descriptor);
    return version.container.jsApiImplsBranches || [];
  }

  public async getContainerJsApiImpls(
    descriptor: AppVersionDescriptor,
  ): Promise<string[]> {
    const version = await this.getVersion(descriptor);
    return version.container.jsApiImpls;
  }

  public async getContainerJsApiImpl(
    descriptor: AppVersionDescriptor,
    jsApiImplName: string,
  ): Promise<string> {
    const jsApiImpls = await this.getContainerJsApiImpls(descriptor);
    const result = _.find(
      jsApiImpls,
      (x) => x === jsApiImplName || x.startsWith(`${jsApiImplName}@`),
    );
    if (!result) {
      throw new Error(
        `Cannot find ${jsApiImplName} JS API implementation in ${descriptor.toString()} Container`,
      );
    }
    return result;
  }

  public async isMiniAppInContainer(
    descriptor: AppVersionDescriptor,
    miniAppName: string,
  ): Promise<boolean> {
    const miniApps = await this.getContainerMiniApps(descriptor);
    const result = _.find(miniApps, (m) => m.startsWith(miniAppName));
    if (!result) {
      return false;
    } else {
      return true;
    }
  }

  public async getContainerMiniApp(
    descriptor: AppVersionDescriptor,
    miniAppName: string,
  ): Promise<string> {
    const miniApps = await this.getContainerMiniApps(descriptor);
    const result = _.find(miniApps, (m) => m.startsWith(miniAppName));
    if (!result) {
      throw new Error(
        `Cannot find ${miniAppName} MiniApp in ${descriptor.toString()} Container`,
      );
    }
    return result;
  }

  public async getNativeDependencies(
    descriptor: AppVersionDescriptor,
  ): Promise<string[]> {
    const version = await this.getVersion(descriptor);
    return version.container.nativeDeps;
  }

  public async isNativeDependencyInContainer(
    descriptor: AppVersionDescriptor,
    nativeDepName: string,
  ): Promise<boolean> {
    const nativeDeps = await this.getNativeDependencies(descriptor);
    const result = _.find(
      nativeDeps,
      (x) => x === nativeDepName || x.startsWith(`${nativeDepName}@`),
    );
    if (!result) {
      return false;
    } else {
      return true;
    }
  }

  public async getContainerNativeDependency(
    descriptor: AppVersionDescriptor,
    nativeDepName: string,
  ): Promise<string> {
    const nativeDeps = await this.getNativeDependencies(descriptor);
    const result = _.find(
      nativeDeps,
      (x) => x === nativeDepName || x.startsWith(`${nativeDepName}@`),
    );
    if (!result) {
      throw new Error(
        `Cannot find ${nativeDepName} native dependency in ${descriptor.toString()} Container`,
      );
    }
    return result;
  }

  public async getConfig(descriptor?: AnyAppDescriptor): Promise<any | void> {
    if (descriptor && !(await this.hasDescriptor(descriptor))) {
      throw new Error(`${descriptor} does not exist in Cauldron`);
    }
    const configByLevel = await this.getConfigByLevel(descriptor);
    return (
      configByLevel.get(CauldronConfigLevel.NativeAppVersion) ||
      configByLevel.get(CauldronConfigLevel.NativeAppPlatform) ||
      configByLevel.get(CauldronConfigLevel.NativeApp) ||
      configByLevel.get(CauldronConfigLevel.Top)
    );
  }

  public async getConfigStrict(descriptor?: AnyAppDescriptor): Promise<any> {
    const cauldronFilePath = this.getConfigFilePath(descriptor);
    return (await this.hasFile({ cauldronFilePath }))
      ? this.getFile({ cauldronFilePath }).then((c) => JSON.parse(c.toString()))
      : {};
  }

  public async delConfig(descriptor?: AnyAppDescriptor) {
    if (descriptor && !(await this.hasDescriptor(descriptor))) {
      throw new Error(`${descriptor} does not exist in Cauldron`);
    }
    const configFilePath = this.getConfigFilePath(descriptor);
    if (await this.fileStore.hasFile(configFilePath)) {
      await this.fileStore.removeFile(configFilePath);
    }
  }

  public async setConfig({
    descriptor,
    config,
  }: {
    descriptor?: AppNameDescriptor;
    config: any;
  }) {
    if (descriptor && !(await this.hasDescriptor(descriptor))) {
      throw new Error(`${descriptor} does not exist in Cauldron`);
    }
    const configFilePath = this.getConfigFilePath(descriptor);
    return this.fileStore.storeFile(
      configFilePath,
      JSON.stringify(config, null, 2),
    );
  }

  public async updateConfig({
    descriptor,
    config,
  }: {
    descriptor?: AnyAppDescriptor;
    config: any;
  }) {
    if (descriptor && !(await this.hasDescriptor(descriptor))) {
      throw new Error(`${descriptor} does not exist in Cauldron`);
    }
    let newConfig = config;
    const configFilePath = this.getConfigFilePath(descriptor);
    if (await this.fileStore.hasFile(configFilePath)) {
      const currentConf = await this.fileStore.getFile(configFilePath);
      const currentConfObj = JSON.parse((currentConf as Buffer).toString());
      newConfig = Object.assign(currentConfObj, config);
    }
    await this.fileStore.storeFile(
      configFilePath,
      JSON.stringify(newConfig, null, 2),
    );
  }

  public getConfigFilePath(descriptor?: AnyAppDescriptor) {
    return descriptor
      ? `config/${descriptor.name ? descriptor.name : ''}${
          descriptor instanceof AppPlatformDescriptor ||
          descriptor instanceof AppVersionDescriptor
            ? '-' + descriptor.platform
            : ''
        }${
          descriptor instanceof AppVersionDescriptor
            ? '-' + descriptor.version
            : ''
        }.json`
      : 'config/default.json';
  }

  public async getConfigByLevel(
    descriptor?: AnyAppDescriptor,
  ): Promise<Map<CauldronConfigLevel, any>> {
    const result = new Map();
    let currentDescriptor = descriptor;
    if (currentDescriptor instanceof AppVersionDescriptor) {
      const appVersionConfig = await this.getConfigStrict(currentDescriptor);
      result.set(CauldronConfigLevel.NativeAppVersion, appVersionConfig || {});
      currentDescriptor = currentDescriptor.toAppPlatformDescriptor();
    }
    if (currentDescriptor instanceof AppPlatformDescriptor) {
      const appPlatformConfig = await this.getConfigStrict(currentDescriptor);
      result.set(
        CauldronConfigLevel.NativeAppPlatform,
        appPlatformConfig || {},
      );
      currentDescriptor = currentDescriptor.toAppNameDescriptor();
    }
    if (currentDescriptor instanceof AppNameDescriptor) {
      const appNameConfig = await this.getConfigStrict(currentDescriptor);
      result.set(CauldronConfigLevel.NativeApp, appNameConfig || {});
    }
    const topLevelConfig = await this.getConfigStrict();
    result.set(CauldronConfigLevel.Top, topLevelConfig || {});

    return result;
  }

  public async getObjectMatchingDescriptor(
    descriptor?: AppNameDescriptor,
  ): Promise<CauldronObject> {
    return !descriptor
      ? this.getCauldron()
      : descriptor instanceof AppVersionDescriptor
      ? this.getVersion(descriptor)
      : descriptor instanceof AppPlatformDescriptor
      ? this.getPlatform(descriptor)
      : this.getNativeApplication(descriptor);
  }

  // =====================================================================================
  // WRITE OPERATIONS
  // =====================================================================================

  public async clearCauldron(): Promise<void> {
    const cauldron = await this.getCauldron();
    cauldron.nativeApps = [];
    return this.commit('Clear Cauldron');
  }

  public async addDescriptor(descriptor: AnyAppDescriptor): Promise<void> {
    if (!(await this.hasNativeApplication(descriptor))) {
      await this.createNativeApplication({ name: descriptor.name });
    }
    if (
      (descriptor instanceof AppPlatformDescriptor ||
        descriptor instanceof AppVersionDescriptor) &&
      !(await this.hasPlatform(descriptor))
    ) {
      await this.createPlatform(descriptor, { name: descriptor.platform });
    }
    if (
      descriptor instanceof AppVersionDescriptor &&
      !(await this.hasVersion(descriptor))
    ) {
      await this.createVersion(descriptor, { name: descriptor.version });
    }
  }

  public async removeDescriptor(descriptor: AnyAppDescriptor): Promise<void> {
    if (descriptor instanceof AppVersionDescriptor) {
      return this.removeVersion(descriptor);
    } else if (descriptor instanceof AppPlatformDescriptor) {
      return this.removePlatform(descriptor);
    } else {
      return this.removeNativeApplication(descriptor);
    }
  }

  public async createNativeApplication(nativeApplication: any): Promise<void> {
    const cauldron = await this.getCauldron();
    if (exists(cauldron.nativeApps, nativeApplication.name)) {
      throw new Error(`${nativeApplication.name} already exists`);
    }
    const validatedNativeApplication = await joiValidate(
      nativeApplication,
      schemas.nativeApplication,
    );
    cauldron.nativeApps.push(validatedNativeApplication);
    cauldron.nativeApps.sort((a, b) => a.name.localeCompare(b.name));
    return this.commit(`Create ${nativeApplication.name} native application`);
  }

  public async removeNativeApplication(
    descriptor: AppNameDescriptor,
  ): Promise<void> {
    const cauldron = await this.getCauldron();
    if (!exists(cauldron.nativeApps, descriptor.name)) {
      throw new Error(`${descriptor.name} was not found in Cauldron`);
    }
    _.remove(cauldron.nativeApps, (x) => x.name === descriptor.name);
    return this.commit(`Remove ${descriptor.toString()}`);
  }

  public async createPlatform(
    descriptor: AppNameDescriptor,
    platform: any,
  ): Promise<void> {
    const nativeApplication = await this.getNativeApplication(descriptor);
    const platformName = platform.name;
    if (exists(nativeApplication.platforms, platform.name)) {
      throw new Error(
        `${platformName} platform already exists for ${descriptor.toString()}`,
      );
    }
    const validatedPlatform = await joiValidate(
      platform,
      schemas.nativeApplicationPlatform,
    );
    nativeApplication.platforms.push(validatedPlatform);
    nativeApplication.platforms.sort((a, b) => a.name.localeCompare(b.name));
    return this.commit(
      `Create ${platformName} platform for ${descriptor.toString()}`,
    );
  }

  public async removePlatform(descriptor: AppPlatformDescriptor) {
    const platform = descriptor.platform;
    if (!platform) {
      throw new Error(
        'removePlatform: descriptor should include the platform to be removed',
      );
    }
    const nativeApplication = await this.getNativeApplication(descriptor);
    if (!exists(nativeApplication.platforms, platform)) {
      throw new Error(
        `${platform} platform does not exist for ${descriptor.name} native application`,
      );
    }
    _.remove(nativeApplication.platforms, (x) => x.name === platform);
    return this.commit(`Remove ${descriptor.toString()}`);
  }

  public async createVersion(
    descriptor: AppPlatformDescriptor,
    version: any,
  ): Promise<void> {
    const platform = await this.getPlatform(descriptor);
    const versionName = version.name;
    if (exists(platform.versions, versionName)) {
      throw new Error(
        `${versionName} version already exists for ${descriptor.toString()}`,
      );
    }
    const validatedVersion = await joiValidate(
      version,
      schemas.nativeApplicationVersion,
    );
    platform.versions.push(validatedVersion);
    const semverCompliantVersions = platform.versions.filter(
      (v) => semver.valid(v.name) !== null,
    );
    const semverNonCompliantVersions = platform.versions.filter(
      (v) => semver.valid(v.name) === null,
    );
    semverCompliantVersions.sort((a, b) => semver.compare(a.name, b.name));
    semverNonCompliantVersions.sort();
    platform.versions = [
      ...semverCompliantVersions,
      ...semverNonCompliantVersions,
    ];
    return this.commit(
      `Create version ${versionName} for ${descriptor.toString()}`,
    );
  }

  public async removeVersion(descriptor: AppVersionDescriptor): Promise<void> {
    const versionName = descriptor.version;
    if (!versionName) {
      throw new Error(
        'removeVersion: descriptor should include the version to be removed',
      );
    }
    const platform = await this.getPlatform(descriptor);
    if (!exists(platform.versions, versionName)) {
      throw new Error(
        `${versionName} version does not exist for ${descriptor.toString()}`,
      );
    }
    _.remove(platform.versions, (x) => x.name === versionName);
    return this.commit(`Remove ${descriptor.toString()}`);
  }

  public async updateVersion(
    descriptor: AppVersionDescriptor,
    newVersion: any,
  ): Promise<void> {
    const validatedVersion = await joiValidate(
      newVersion,
      schemas.nativeAplicationVersionPatch,
    );
    const version = await this.getVersion(descriptor);
    if (validatedVersion.isReleased != null) {
      version.isReleased = validatedVersion.isReleased;
      await this.commit(`Update release status of ${descriptor.toString()}`);
    }
  }

  public async addOrUpdateDescription(
    descriptor: AppVersionDescriptor,
    description: string,
  ): Promise<void> {
    const version = await this.getVersion(descriptor);
    version.description = description;
    await this.commit(`Update description of ${descriptor.toString()}`);
  }

  // ------------------------------------------------------------------------------
  // Container versioning
  // ------------------------------------------------------------------------------

  public async updateTopLevelContainerVersion(
    descriptor: AppPlatformDescriptor | AppVersionDescriptor,
    newContainerVersion: string,
  ): Promise<void> {
    const platform = await this.getPlatform(descriptor);
    platform.containerVersion = newContainerVersion;
    return this.commit(
      `Update top level Container version of ${descriptor.toString()} to ${newContainerVersion}`,
    );
  }

  public async updateContainerVersion(
    descriptor: AppVersionDescriptor,
    newContainerVersion: string,
  ): Promise<void> {
    const version = await this.getVersion(descriptor);
    version.containerVersion = newContainerVersion;
    return this.commit(
      `Update container version of ${descriptor.toString()} to ${newContainerVersion}`,
    );
  }

  public async getTopLevelContainerVersion(
    descriptor: AppVersionDescriptor | AppPlatformDescriptor,
  ): Promise<string | void> {
    const platform = await this.getPlatform(descriptor);
    return platform.containerVersion;
  }

  public async getContainerVersion(
    descriptor: AppVersionDescriptor,
  ): Promise<string> {
    const version = await this.getVersion(descriptor);
    return version.containerVersion;
  }

  // ------------------------------------------------------------------------------
  // Ern version used for Container generation
  // ------------------------------------------------------------------------------

  public async updateContainerErnVersion(
    descriptor: AppVersionDescriptor,
    ernVersion: string,
  ) {
    const version = await this.getVersion(descriptor);
    version.container.ernVersion = ernVersion;
    return this.commit(
      `Update version of ern used to generate Container of ${descriptor.toString()}`,
    );
  }

  public async getContainerErnVersion(
    descriptor: AppVersionDescriptor,
  ): Promise<string | void> {
    const version = await this.getVersion(descriptor);
    return version.container.ernVersion;
  }

  public async hasCodePushEntries(
    descriptor: AppVersionDescriptor,
    deploymentName: string,
  ): Promise<boolean> {
    const version = await this.getVersion(descriptor);
    return version.codePush[deploymentName] != null;
  }

  public async addCodePushEntry(
    descriptor: AppVersionDescriptor,
    codePushEntry: CauldronCodePushEntry,
  ): Promise<void> {
    const version = await this.getVersion(descriptor);
    const deploymentName = codePushEntry.metadata.deploymentName;
    version.codePush[deploymentName]
      ? version.codePush[deploymentName].push(codePushEntry)
      : (version.codePush[deploymentName] = [codePushEntry]);
    return this.commit(`New CodePush OTA update for ${descriptor.toString()}`);
  }

  public async setCodePushEntries(
    descriptor: AppVersionDescriptor,
    deploymentName: string,
    codePushEntries: CauldronCodePushEntry[],
  ): Promise<void> {
    const version = await this.getVersion(descriptor);
    version.codePush[deploymentName] = codePushEntries;
    return this.commit(`Set codePush entries in ${descriptor.toString()}`);
  }

  // =====================================================================================
  // FILE OPERATIONS
  // =====================================================================================

  // -------------------------------------------------------------------------------------
  // ARBITRARY FILE ACCESS
  // -------------------------------------------------------------------------------------

  public async addFile({
    cauldronFilePath,
    fileContent,
    fileMode,
  }: {
    cauldronFilePath: string;
    fileContent: string | Buffer;
    fileMode?: string;
  }) {
    if (!cauldronFilePath) {
      throw new Error('[addFile] cauldronFilePath is required');
    }
    if (!fileContent) {
      throw new Error('[addFile] fileContent is required');
    }
    cauldronFilePath = normalizeCauldronFilePath(cauldronFilePath);
    if (await this.hasFile({ cauldronFilePath })) {
      throw new Error(
        `[addFile] ${cauldronFilePath} already exists. Use updateFile instead.`,
      );
    }
    return this.fileStore.storeFile(cauldronFilePath, fileContent, fileMode);
  }

  public async updateFile({
    cauldronFilePath,
    fileContent,
    fileMode,
  }: {
    cauldronFilePath: string;
    fileContent: string | Buffer;
    fileMode?: string;
  }) {
    if (!cauldronFilePath) {
      throw new Error('[updateFile] cauldronFilePath is required');
    }
    if (!fileContent) {
      throw new Error('[updateFile] fileContent is required');
    }
    cauldronFilePath = normalizeCauldronFilePath(cauldronFilePath);
    if (!(await this.hasFile({ cauldronFilePath }))) {
      throw new Error(
        `[updateFile] ${cauldronFilePath} does not exist. Use addFile first.`,
      );
    }
    return this.fileStore.storeFile(cauldronFilePath, fileContent, fileMode);
  }

  public async removeFile({ cauldronFilePath }: { cauldronFilePath: string }) {
    if (!cauldronFilePath) {
      throw new Error('[removeFile] cauldronFilePath is required');
    }
    cauldronFilePath = normalizeCauldronFilePath(cauldronFilePath);
    if (!(await this.hasFile({ cauldronFilePath }))) {
      throw new Error(`[removeFile] ${cauldronFilePath} does not exist`);
    }
    return this.fileStore.removeFile(cauldronFilePath);
  }

  public async hasFile({ cauldronFilePath }: { cauldronFilePath: string }) {
    cauldronFilePath = normalizeCauldronFilePath(cauldronFilePath);
    return this.fileStore.hasFile(cauldronFilePath);
  }

  public async getFile({
    cauldronFilePath,
  }: {
    cauldronFilePath: string;
  }): Promise<Buffer> {
    if (!cauldronFilePath) {
      throw new Error('[removeFile] cauldronFilePath is required');
    }
    cauldronFilePath = normalizeCauldronFilePath(cauldronFilePath);
    if (!(await this.hasFile({ cauldronFilePath }))) {
      throw new Error(`[getFile] ${cauldronFilePath} does not exist.`);
    }
    const result = await this.fileStore.getFile(cauldronFilePath);
    return result as Buffer;
  }

  // -------------------------------------------------------------------------------------
  // YARN LOCKS STORE ACCESS
  // -------------------------------------------------------------------------------------

  /**
   * Gets the relative path (from the root of the Cauldron repo) to
   * a given yarn lock file
   * @param yarnLockFileName Yarn lock file name
   */
  public getRelativePathToYarnLock(yarnLockFileName: string): string {
    return path.join(yarnLocksStoreDirectory, yarnLockFileName);
  }

  public async hasYarnLock(
    descriptor: AppVersionDescriptor,
    key: string,
  ): Promise<boolean> {
    const version = await this.getVersion(descriptor);
    if (version.yarnLocks[key]) {
      return true;
    } else {
      return false;
    }
  }

  public async addYarnLock(
    descriptor: AppVersionDescriptor,
    key: string,
    yarnlock: string | Buffer,
  ): Promise<string> {
    const version = await this.getVersion(descriptor);
    const fileName = uuidv4();
    const pathToYarnLock = this.getRelativePathToYarnLock(fileName);
    await this.fileStore.storeFile(pathToYarnLock, yarnlock);
    version.yarnLocks[key] = fileName;
    await this.commit(`Add yarn.lock for ${descriptor.toString()} ${key}`);
    return fileName;
  }

  public async copyYarnLock(
    sourceDescriptor: AppVersionDescriptor,
    targetDescriptor: AppVersionDescriptor,
    key: string,
  ): Promise<string | void> {
    const sourceYarnLock = await this.getYarnLock(sourceDescriptor, key);
    if (sourceYarnLock) {
      return this.addYarnLock(targetDescriptor, key, sourceYarnLock);
    }
  }

  public async getYarnLockId(
    descriptor: AppVersionDescriptor,
    key: string,
  ): Promise<string | void> {
    const version = await this.getVersion(descriptor);
    return version.yarnLocks[key];
  }

  public async getYarnLock(
    descriptor: AppVersionDescriptor,
    key: string,
  ): Promise<Buffer | void> {
    const version = await this.getVersion(descriptor);
    const fileName = version.yarnLocks[key];
    if (fileName) {
      const pathToYarnLock = this.getRelativePathToYarnLock(fileName);
      return this.fileStore.getFile(pathToYarnLock);
    }
  }

  public async getPathToYarnLock(
    descriptor: AppVersionDescriptor,
    key: string,
  ): Promise<string | undefined> {
    const version = await this.getVersion(descriptor);
    const fileName = version.yarnLocks[key];
    if (fileName) {
      const pathToYarnLock = this.getRelativePathToYarnLock(fileName);
      return this.fileStore.getPathToFile(pathToYarnLock);
    }
  }

  public async removeYarnLock(
    descriptor: AppVersionDescriptor,
    key: string,
  ): Promise<boolean> {
    const version = await this.getVersion(descriptor);
    const fileName = version.yarnLocks[key];
    if (fileName) {
      const pathToYarnLock = this.getRelativePathToYarnLock(fileName);
      if (await this.fileStore.removeFile(pathToYarnLock)) {
        delete version.yarnLocks[key];
        await this.commit(
          `Remove yarn.lock for ${descriptor.toString()} ${key}`,
        );
        return true;
      }
    }
    return false;
  }

  public async updateYarnLock(
    descriptor: AppVersionDescriptor,
    key: string,
    yarnlock: string | Buffer,
  ): Promise<boolean> {
    const version = await this.getVersion(descriptor);
    const fileName = version.yarnLocks[key];
    if (fileName) {
      const yarnLockPath = this.getRelativePathToYarnLock(fileName);
      await this.fileStore.storeFile(yarnLockPath, yarnlock);
      await this.commit(`Update yarn.lock for ${descriptor.toString()} ${key}`);
      return true;
    }
    return false;
  }

  public async updateYarnLockId(
    descriptor: AppVersionDescriptor,
    key: string,
    id: string,
  ) {
    const version = await this.getVersion(descriptor);
    const fileName = version.yarnLocks[key];
    if (fileName) {
      const pathToYarnLock = this.getRelativePathToYarnLock(fileName);
      await this.fileStore.removeFile(pathToYarnLock);
    }
    version.yarnLocks[key] = id;
    await this.commit(
      `Update yarn.lock id for ${descriptor.toString()} ${key}`,
    );
  }

  public async setYarnLocks(descriptor: AppVersionDescriptor, yarnLocks: any) {
    const version = await this.getVersion(descriptor);
    version.yarnLocks = yarnLocks;
    await this.commit(`Set yarn locks for ${descriptor.toString()}`);
  }

  // -------------------------------------------------------------------------------------
  // BUNDLES STORE ACCESS
  // -------------------------------------------------------------------------------------

  /**
   * Gets the relative path (from the root of the Cauldron repo) to
   * a given bundle file
   * @param bundleFileName Bundle file name
   */
  public getRelativePathToBundle(bundleFileName: string): string {
    return path.join(bundlesStoreDirectory, bundleFileName);
  }

  public async addBundle(
    descriptor: AppVersionDescriptor,
    bundle: string | Buffer,
  ) {
    const filename = this.getBundleZipFileName(descriptor);
    const pathToBundle = this.getRelativePathToBundle(filename);
    await this.fileStore.storeFile(pathToBundle, bundle);
    return this.commit(`Add bundle for ${descriptor.toString()}`);
  }

  public async hasBundle(descriptor: AppVersionDescriptor): Promise<boolean> {
    const filename = this.getBundleZipFileName(descriptor);
    const pathToBundle = this.getRelativePathToBundle(filename);
    return this.fileStore.hasFile(pathToBundle);
  }

  public async getBundle(descriptor: AppVersionDescriptor): Promise<Buffer> {
    const filename = this.getBundleZipFileName(descriptor);
    const pathToBundle = this.getRelativePathToBundle(filename);
    const zippedBundle = await this.fileStore.getFile(pathToBundle);
    if (!zippedBundle) {
      throw new Error(
        `No zipped bundle stored in Cauldron for ${descriptor.toString()}`,
      );
    }
    return zippedBundle;
  }

  public getBundleZipFileName(descriptor: AppVersionDescriptor): string {
    return `${descriptor.toString().replace(/:/g, '-')}.zip`;
  }

  /**
   * Empty the Container of a given native application version
   * Removes all MiniApps/JsApiImpls and native dependencies from
   * the target Container and Container yarn lock
   * @param descriptor Target native application version descriptor
   */
  public async emptyContainer(descriptor: AppVersionDescriptor) {
    const version = await this.getVersion(descriptor);
    version.container.jsApiImpls = [];
    version.container.miniApps = [];
    version.container.nativeDeps = [];
    delete version.yarnLocks.container;
    await this.commit(`Empty Container of ${descriptor}`);
  }

  public throwIfNoVersionInPackagePath(packagePath: PackagePath) {
    if (!packagePath.version) {
      throw new Error(`No version/branch/tag specified in ${packagePath}`);
    }
  }

  public async hasJsPackageBranchInContainer(
    descriptor: AppVersionDescriptor,
    jsPackage: PackagePath,
    key: ContainerJsPackagesBranchesArrayKey,
  ) {
    const container = (await this.getVersion(descriptor)).container;
    return (
      _.find(container[key] || [], (p) =>
        jsPackage.same(PackagePath.fromString(p), { ignoreVersion: true }),
      ) !== undefined
    );
  }

  public async updatePackageInContainer(
    descriptor: AppVersionDescriptor,
    pkg: PackagePath,
    key: ContainerPackagesArrayKey,
  ): Promise<void> {
    this.throwIfNoVersionInPackagePath(pkg);
    const container = (await this.getVersion(descriptor)).container;
    const existingPkg = _.find(container[key], (p) =>
      pkg.same(PackagePath.fromString(p), { ignoreVersion: true }),
    );
    if (!existingPkg) {
      throw new Error(
        `${pkg.basePath} does not exist in ${descriptor} Container`,
      );
    }
    container[key] = _.map(container[key], (e) =>
      e === existingPkg ? pkg.fullPath : e,
    );
    return this.commit(
      `Update ${pkg.basePath} to version ${pkg.version} in ${descriptor} Container`,
    );
  }

  public async addPackageToContainer(
    descriptor: AppVersionDescriptor,
    pkg: PackagePath,
    key: ContainerPackagesArrayKey,
  ): Promise<void> {
    if (!pkg.isFilePath) {
      this.throwIfNoVersionInPackagePath(pkg);
    }
    const container = (await this.getVersion(descriptor)).container;
    if (!container[key]) {
      container[key] = [];
    } else if (
      container[key]!.map((m) => PackagePath.fromString(m).basePath).includes(
        pkg.basePath,
      )
    ) {
      throw new Error(
        `${pkg.basePath} is already in ${descriptor} Container. Use update instead.`,
      );
    }
    container[key]!.push(pkg.fullPath);
    return this.commit(
      `Add ${pkg.basePath} with version ${pkg.version} in ${descriptor} Container`,
    );
  }

  public async removePackageFromContainer(
    descriptor: AppVersionDescriptor,
    pkg: PackagePath,
    key: ContainerPackagesArrayKey,
  ): Promise<void> {
    const container = (await this.getVersion(descriptor)).container;
    const existingPkg = _.find(container[key], (p) =>
      pkg.same(PackagePath.fromString(p), { ignoreVersion: true }),
    );
    if (!existingPkg) {
      throw new Error(
        `${pkg.basePath} does not exist in ${descriptor} Container`,
      );
    }
    _.remove(container[key]!, (p) => p === existingPkg);
    return this.commit(`Remove ${pkg} branch from ${descriptor} Container`);
  }

  public async setPackagesInContainer(
    descriptor: AppVersionDescriptor,
    pkgs: PackagePath[],
    key: ContainerPackagesArrayKey,
  ): Promise<void> {
    const container = (await this.getVersion(descriptor)).container;
    container[key]! = pkgs.map((p) => p.fullPath).sort();
    return this.commit(`Set native dependencies in ${descriptor} Container`);
  }
}
