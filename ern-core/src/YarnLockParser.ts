import * as lockfile from '@yarnpkg/lockfile';
import fs from 'fs-extra';
import { PackagePath } from './PackagePath';

export interface PackagePathWithResolvedVersion {
  pkgPath: PackagePath;
  version: string;
}

export class YarnLockParser {
  /**
   * Creates an instance of YarnLockParser given a
   * path to a yarn.lock file
   * @param yarnLockPath Path the to a yarn.lock file
   */
  public static fromPath(yarnLockPath: string) {
    if (!fs.pathExistsSync(yarnLockPath)) {
      throw new Error(`Path to yarn.lock ${yarnLockPath} does not exist`);
    }
    return new YarnLockParser(fs.readFileSync(yarnLockPath, 'utf8'));
  }

  /**
   * Creates an instance of YarnLockParser given the
   * content of a yarn.lock file as a string
   * @param yarnLockContent yarn.lock file content
   */
  public static fromContent(yarnLockContent: string) {
    return new YarnLockParser(yarnLockContent);
  }

  /**
   * The yarn.lock file content
   */
  public readonly content: string;

  /**
   * The parsed yarn.lock
   */
  public readonly parsed: any;

  private constructor(yarnLockContent: string) {
    this.content = yarnLockContent;
    this.parsed = lockfile.parse(yarnLockContent);
  }

  /**
   * Find a given package in the yarn.lock
   * @param pkg A package path with or without version
   * @returns An array of PackagePathWithResolvedVersion containing all
   * packages matching the given PackagePath, along with their resolved
   * version.
   */
  public findPackage(pkg: PackagePath): PackagePathWithResolvedVersion[] {
    return pkg.version
      ? Object.keys(this.parsed.object)
          .filter((k) => k === pkg.fullPath)
          .map((k) => ({
            pkgPath: PackagePath.fromString(k),
            version: this.parsed.object[k]?.version,
          }))
      : Object.keys(this.parsed.object)
          .filter((k) => k.startsWith(`${pkg.basePath}@`))
          .map((k) => ({
            pkgPath: PackagePath.fromString(k),
            version: this.parsed.object[k]?.version,
          }));
  }

  /**
   * Finds all packages which have a given dependency
   * @param dependency The dependency as a PackagePath
   * @returns An array of PackagePathWithResolvedVersion containing all
   * packages that are dependent on the given dependency, along with
   * their resolved version.
   */
  public findPackagesWithDependency(
    dependency: PackagePath,
  ): PackagePathWithResolvedVersion[] {
    return Object.entries(this.parsed.object)
      .filter(([key, value]: [string, any]) =>
        Object.entries(value.dependencies || []).some(
          ([k, v]: [string, string]) =>
            k === dependency.basePath && v === dependency.version,
        ),
      )
      .map(([k, v]: [string, any]) => ({
        pkgPath: PackagePath.fromString(k),
        version: this.parsed.object[k]?.version,
      }));
  }

  /**
   * Builds a dependency tree for a given dependency.
   * @param dep The dependency for which to build a tree
   * @param level Used for recursion, should be left to default
   * @param obj Used for recursion, should be left to default
   * @param topLevel Used for recursion, should be left to default
   * @returns The dependency tree as an object matching
   * treeify specs https://github.com/notatestuser/treeify
   */
  public buildDependencyTree(
    dep: PackagePath,
    level: string = 'top',
    obj: any = {},
    topLevel: boolean = true,
  ) {
    if (level === 'top') {
      const pkgs = this.findPackage(dep);
      if (pkgs) {
        for (const pkg of pkgs) {
          let o: any;
          if (topLevel) {
            const objKey = `${pkg.pkgPath.fullPath} [${pkg.version}]`;
            obj[objKey] = {};
            o = obj[objKey];
          }
          this.buildDependencyTree(pkg.pkgPath, 'inside', o || obj, false);
        }
      }
    } else {
      const pkgs = this.findPackagesWithDependency(dep);
      if (pkgs) {
        for (const pkg of pkgs) {
          const objKey = `${pkg.pkgPath.fullPath} [${pkg.version}]`;
          obj[objKey] = {};
          const o = obj[objKey];
          this.buildDependencyTree(pkg.pkgPath, 'top', o, false);
        }
      }
    }
    return obj;
  }
}
