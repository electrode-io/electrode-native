import fs from 'fs-extra';
import path from 'path';
import shell from './shell';
import { yarn } from './clients';
import { PackagePath } from './PackagePath';
import { readPackageJson } from './packageJsonFileUtils';

export class ModuleFactory<T> {
  private readonly packagePrefix?: string;

  public constructor(
    readonly packageCachePath: string,
    {
      packagePrefix,
    }: {
      packagePrefix?: string;
    } = {},
  ) {
    this.packagePrefix = packagePrefix;
  }

  public async getModuleInstance(p: PackagePath): Promise<T> {
    if (!p.isFilePath && !p.isRegistryPath) {
      throw new Error(`Not a supported package path : ${p.toString()}`);
    }
    const pathToModule = await this.getLocalPathToPackage(p);
    return this.instantiateModule(pathToModule);
  }

  private instantiateModule(pathToModule: string): T {
    const Module = require(pathToModule).default;
    return new Module();
  }

  private async getLocalPathToPackage(p: PackagePath): Promise<string> {
    return p.isFilePath
      ? this.getPathToLocalPackage(p)
      : await this.getPathToRegistryPackage(p);
  }

  private getPathToLocalPackage(p: PackagePath): string {
    const pathWithSrc = path.join(p.basePath, 'src');
    return fs.pathExistsSync(pathWithSrc) ? pathWithSrc : p.basePath;
  }

  private async getPathToRegistryPackage(p: PackagePath): Promise<string> {
    if (!this.doesPackageCacheExist()) {
      await this.createPackageCache();
    }

    const modulePackagePath = this.packagePrefix
      ? this.processPackageRegistryPath(p)
      : p;
    await this.refreshCacheFor(modulePackagePath);

    return path.join(
      this.packageCachePath,
      'node_modules',
      modulePackagePath.basePath,
    );
  }

  private doesPackageCacheExist(): boolean {
    return fs.pathExistsSync(this.packageCachePath);
  }

  private async createPackageCache() {
    shell.mkdir('-p', this.packageCachePath);
    try {
      shell.pushd(this.packageCachePath);
      await yarn.init();
    } finally {
      shell.popd();
    }
  }

  private async refreshCacheFor(p: PackagePath) {
    const packageJson = await readPackageJson(this.packageCachePath);
    return packageJson.dependencies?.[p.basePath]
      ? this.upgradeCachedPackage(p)
      : this.addPackageToCache(p);
  }

  private async addPackageToCache(p: PackagePath) {
    shell.pushd(this.packageCachePath);
    try {
      await yarn.add(p);
    } finally {
      shell.popd();
    }
  }

  private async upgradeCachedPackage(p: PackagePath) {
    shell.pushd(this.packageCachePath);
    try {
      await yarn.upgrade(p);
    } finally {
      shell.popd();
    }
  }

  private processPackageRegistryPath(p: PackagePath): PackagePath {
    if (
      !p.fullPath.startsWith('@') &&
      !p.fullPath.startsWith(this.packagePrefix!)
    ) {
      return PackagePath.fromString(`${this.packagePrefix}${p.fullPath}`);
    }
    return p;
  }
}
