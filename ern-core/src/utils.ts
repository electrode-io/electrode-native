import { yarn } from './clients';
import { PackagePath } from './PackagePath';
import { gitCli } from './gitCli';
import _ from 'lodash';
import { manifest } from './Manifest';
import { API, JS_API_IMPL, MINIAPP, NATIVE_API_IMPL } from './ModuleTypes';
import log from './log';
import { readPackageJson } from './packageJsonFileUtils';
import {
  AnyAppDescriptor,
  AppNameDescriptor,
  AppPlatformDescriptor,
  AppVersionDescriptor,
} from './descriptors';
import camelCase = require('lodash/camelCase');

const gitDirectoryRe = /.*\/(.*).git/;

export async function isPublishedToNpm(
  pkg: string | PackagePath,
): Promise<boolean> {
  if (typeof pkg === 'string') {
    pkg = PackagePath.fromString(pkg);
  }

  let publishedVersions: string[] | undefined;
  try {
    publishedVersions = await yarn.info(pkg, {
      field: 'versions',
    });
  } catch (e) {
    log.debug(e);
    return false;
  }

  if (publishedVersions) {
    const pkgVersion = PackagePath.fromString(pkg.toString()).version;
    return publishedVersions && pkgVersion
      ? publishedVersions.includes(pkgVersion)
      : true;
  }

  return false;
}

/**
 * Camelize name (parameter, property, method, etc)
 *
 * @param word string to be camelize
 * @param lowercaseFirstLetter lower case for first letter if set to true
 * @return camelized string
 */
export function camelize(
  word: string,
  lowercaseFirstLetter: boolean = false,
): string {
  word = camelCase(word);
  return (
    word &&
    word[0][lowercaseFirstLetter ? 'toLowerCase' : 'toUpperCase']() +
      word.substring(1)
  );
}

/**
 * Split the camel case string
 *
 * @param camelCaseString
 * @returns {string}
 */
export function splitCamelCaseString(camelCaseString: string): string[] {
  return camelCaseString.split(/(?=[A-Z])/).map((token) => {
    return token.toLowerCase();
  });
}

export function getDefaultPackageNameForCamelCaseString(
  moduleName: string,
  moduleType?: string,
): string {
  const splitArray = splitCamelCaseString(moduleName);
  switch (moduleType) {
    case API:
      return _.filter(splitArray, (token) => !['api'].includes(token)).join(
        '-',
      );
    case MINIAPP:
      return _.filter(
        splitArray,
        (token) => !['mini', 'app'].includes(token),
      ).join('-');
    case JS_API_IMPL:
    case NATIVE_API_IMPL:
      return _.filter(
        splitArray,
        (token) => !['api', 'impl'].includes(token),
      ).join('-');
    default:
      return splitArray.join('-');
  }
}

export function getModuleSuffix(moduleType: string): string {
  switch (moduleType) {
    case API:
      return 'api';
    case JS_API_IMPL:
      return 'api-impl-js';
    case MINIAPP:
      return 'miniapp';
    case NATIVE_API_IMPL:
      return 'api-impl-native';
    default:
      throw new Error(`Unsupported module type : ${moduleType}`);
  }
}

export function getDefaultPackageNameForModule(
  moduleName: string,
  moduleType: string,
): string {
  const basePackageName = getDefaultPackageNameForCamelCaseString(
    moduleName,
    moduleType,
  );
  const suffix = getModuleSuffix(moduleType);
  return basePackageName.endsWith(suffix)
    ? basePackageName
    : `${basePackageName}-${suffix}`;
}

export async function isDependencyOfType(
  dependency: PackagePath,
  types: string | string[],
): Promise<boolean> {
  let a: string[] = [];
  a = a.concat(types);
  const ernField = await yarn.info(dependency, {
    field: 'ern',
  });
  return a.indexOf(ernField?.moduleType) > -1;
}

export async function isDependencyApiOrApiImpl(
  dependency: PackagePath,
): Promise<boolean> {
  return isDependencyOfType(dependency, [API, JS_API_IMPL, NATIVE_API_IMPL]);
}

export async function isDependencyApi(
  dependency: PackagePath,
): Promise<boolean> {
  return isDependencyOfType(dependency, API);
}

export async function isDependencyApiImpl(
  dependency: PackagePath,
): Promise<boolean> {
  return isDependencyOfType(dependency, [JS_API_IMPL, NATIVE_API_IMPL]);
}

export async function getPackageName(pkg: PackagePath) {
  if (pkg.isGitPath) {
    throw new Error(
      'getPackageName does not support git based package path yet',
    );
  }
  return pkg.name!;
}

export async function isDependencyPathApiImpl(
  dependencyPath: string,
  type?: string,
): Promise<boolean> {
  const modulesTypes = type ? [type] : [JS_API_IMPL, NATIVE_API_IMPL];

  const packageJson = await readPackageJson(dependencyPath);
  return modulesTypes.indexOf(packageJson.ern?.moduleType) > -1;
}

export async function isDependencyPathJsApiImpl(
  dependencyPath: string,
): Promise<boolean> {
  return isDependencyPathApiImpl(dependencyPath, JS_API_IMPL);
}

export async function isDependencyPathNativeApiImpl(
  dependencyPath: string,
  type?: string,
): Promise<boolean> {
  return isDependencyPathApiImpl(dependencyPath, NATIVE_API_IMPL);
}

/**
 * Version of react-native dependency in manifest
 */
export async function reactNativeManifestVersion({
  manifestId,
}: { manifestId?: string } = {}) {
  const reactNativebasePathDependency = PackagePath.fromString('react-native');
  const reactNativeDependency = await manifest.getNativeDependency(
    reactNativebasePathDependency,
    { manifestId },
  );

  if (!reactNativeDependency) {
    throw new Error('Could not retrieve react native dependency from manifest');
  }

  return reactNativeDependency.version;
}

export function isValidElectrodeNativeModuleName(name: string): boolean {
  return /^[A-Z_][0-9A-Z_-]*$/i.test(name);
}

export function logErrorAndExitProcess(e: any, code: number = 1) {
  if (e instanceof Error) {
    log.error(`An error occurred: ${e.message && e.message.trimRight()}`);
    log.debug(e.stack!);
  } else if (e instanceof Object) {
    log.error(`An error occurred: ${JSON.stringify(e)}`);
  } else {
    log.error(`An error occurred: ${e}`);
  }

  process.exit(code);
}

export function coerceToAppNameDescriptorArray(
  v: string | AnyAppDescriptor | (string | AnyAppDescriptor)[],
): AppNameDescriptor[] {
  return v instanceof Array
    ? v.map(coerceToAppNameDescriptor)
    : [coerceToAppNameDescriptor(v)];
}

export function coerceToAppPlatformDescriptorArray(
  v:
    | string
    | AppVersionDescriptor
    | AppPlatformDescriptor
    | (string | AppVersionDescriptor | AppPlatformDescriptor)[],
): AppPlatformDescriptor[] {
  return v instanceof Array
    ? v.map(coerceToAppPlatformDescriptor)
    : [coerceToAppPlatformDescriptor(v)];
}

export function coerceToAnyAppDescriptorArray(
  v: string | AnyAppDescriptor | (string | AnyAppDescriptor)[],
) {
  return v instanceof Array
    ? v.map(coerceToAnyAppDescriptor)
    : [coerceToAnyAppDescriptor(v)];
}

export function coerceToAppVersionDescriptorArray(
  v: string | AppVersionDescriptor | (string | AppVersionDescriptor)[],
): AppVersionDescriptor[] {
  return v instanceof Array
    ? v.map(coerceToAppVersionDescriptor)
    : [coerceToAppVersionDescriptor(v)];
}

export function coerceToAppNameDescriptor(
  v: string | AnyAppDescriptor,
): AppNameDescriptor {
  return typeof v === 'string'
    ? AppVersionDescriptor.fromString(v)
    : v.toAppNameDescriptor();
}

export function coerceToAppPlatformDescriptor(
  v: string | AppPlatformDescriptor | AppVersionDescriptor,
): AppPlatformDescriptor {
  return typeof v === 'string'
    ? AppPlatformDescriptor.fromString(v)
    : v.toAppPlatformDescriptor();
}

export function coerceToAppVersionDescriptor(
  v: string | AppVersionDescriptor,
): AppVersionDescriptor {
  return typeof v === 'string' ? AppVersionDescriptor.fromString(v) : v;
}

export function coerceToAnyAppDescriptor(v: string | AnyAppDescriptor) {
  return typeof v === 'string' ? v.toAppDescriptor() : v;
}

export function coerceToPackagePathArray(
  v: string | PackagePath | (string | PackagePath)[],
): PackagePath[] {
  return v instanceof Array
    ? v.map(coerceToPackagePath)
    : [coerceToPackagePath(v)];
}

export function coerceToPackagePath(v: string | PackagePath): PackagePath {
  return typeof v === 'string' ? PackagePath.fromString(v) : v;
}

const gitRefBranch = (branch: string) => `refs/heads/${branch}`;
const gitRefTag = (tag: string) => `refs/tags/${tag}`;
const gitShaLength = 40;

export async function isGitBranch(p: PackagePath): Promise<boolean> {
  if (!p.isGitPath) {
    return false;
  }
  if (p.isGitPath && !p.version) {
    return true;
  }
  const heads = await gitCli().listRemote(['--heads', p.basePath]);
  return heads.includes(gitRefBranch(p.version!));
}

export async function isGitTag(p: PackagePath): Promise<boolean> {
  if (!p.isGitPath || !p.version) {
    return false;
  }
  const tags = await gitCli().listRemote(['--tags', p.basePath]);
  return tags.includes(gitRefTag(p.version));
}

export async function getCommitShaOfGitBranchOrTag(
  p: PackagePath,
): Promise<string> {
  if (!p.isGitPath) {
    throw new Error(`${p} is not a git path`);
  }
  if (!p.version) {
    throw new Error(`${p} does not include a branch or tag`);
  }
  const result = await gitCli().listRemote([p.basePath, p.version]);
  if (!result || result === '') {
    throw new Error(`${p.version} branch or tag not found in ${p.basePath}`);
  }
  return result.substring(0, gitShaLength);
}

export async function getCommitShaOfGitPackage(p: PackagePath) {
  if (!p.isGitPath) {
    throw new Error(`${p} is not a git path`);
  }
  if ((await isGitBranch(p)) || (await isGitTag(p))) {
    return getCommitShaOfGitBranchOrTag(p);
  }
  return p.version;
}
