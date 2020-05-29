import { yarn } from './clients'
import { PackagePath } from './PackagePath'
import { gitCli } from './gitCli'
import http from 'http'
import _ from 'lodash'
import { manifest } from './Manifest'
import * as ModuleType from './ModuleTypes'
import path from 'path'
import log from './log'
import { readPackageJson } from './packageJsonFileUtils'
import {
  AnyAppDescriptor,
  AppNameDescriptor,
  AppPlatformDescriptor,
  AppVersionDescriptor,
} from './descriptors'
import camelCase = require('lodash/camelCase')

const gitDirectoryRe = /.*\/(.*).git/

export async function isPublishedToNpm(
  pkg: string | PackagePath
): Promise<boolean> {
  if (typeof pkg === 'string') {
    pkg = PackagePath.fromString(pkg)
  }

  let publishedVersions: string[] | undefined
  try {
    publishedVersions = await yarn.info(pkg, {
      field: 'versions',
    })
  } catch (e) {
    log.debug(e)
    return false
  }

  if (publishedVersions) {
    const pkgVersion = PackagePath.fromString(pkg.toString()).version
    return publishedVersions && pkgVersion
      ? publishedVersions.includes(pkgVersion)
      : true
  }

  return false
}

export async function httpGet(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    http
      .get(url, res => {
        resolve(res)
      })
      .on('error', e => {
        reject(e)
      })
  })
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
  lowercaseFirstLetter: boolean = false
): string {
  word = camelCase(word)
  return (
    word &&
    word[0][lowercaseFirstLetter ? 'toLowerCase' : 'toUpperCase']() +
      word.substring(1)
  )
}

/**
 * Split the camel case string
 *
 * @param camelCaseString
 * @returns {string}
 */
export function splitCamelCaseString(camelCaseString: string): string[] {
  return camelCaseString.split(/(?=[A-Z])/).map(token => {
    return token.toLowerCase()
  })
}

export function getDefaultPackageNameForCamelCaseString(
  moduleName: string,
  moduleType?: string
): string {
  const splitArray = splitCamelCaseString(moduleName)
  switch (moduleType) {
    case ModuleType.MINIAPP:
      return _.filter(
        splitArray,
        token => !['mini', 'app'].includes(token)
      ).join('-')
    case ModuleType.API:
      return _.filter(splitArray, token => !['api'].includes(token)).join('-')
    case ModuleType.JS_API_IMPL:
    case ModuleType.NATIVE_API_IMPL:
      return _.filter(
        splitArray,
        token => !['api', 'impl'].includes(token)
      ).join('-')
    default:
      return splitArray.join('-')
  }
}

export function getDefaultPackageNameForModule(
  moduleName: string,
  moduleType: string
): string {
  const basePackageName = getDefaultPackageNameForCamelCaseString(
    moduleName,
    moduleType
  )
  switch (moduleType) {
    case ModuleType.MINIAPP:
      return basePackageName.concat('-miniapp')
    case ModuleType.API:
      return basePackageName.concat('-api')
    case ModuleType.JS_API_IMPL:
      return basePackageName.concat('-api-impl-js')
    case ModuleType.NATIVE_API_IMPL:
      return basePackageName.concat('-api-impl-native')
    default:
      throw new Error(`Unsupported module type : ${moduleType}`)
  }
}

export async function isDependencyApiOrApiImpl(
  dependency: PackagePath
): Promise<boolean> {
  const isApi = await isDependencyApi(dependency)
  const isApiImpl = !isApi ? await isDependencyApiImpl(dependency) : false
  // Note: using constants as using await in return statement was not satisfying standard checks
  return isApi || isApiImpl
}

export async function isDependencyApi(
  dependency: PackagePath
): Promise<boolean> {
  const pkgName = await getPackageName(dependency)

  if (/^.*react-native-.+-api$/.test(pkgName)) {
    return true
  }

  const depInfo = await yarn.info(dependency, {
    field: 'ern',
  })

  return ModuleType.API === depInfo?.moduleType
}

/**
 *
 * @param dependencyName: Name of the dependency
 * @param forceYanInfo: if true, a yarn info command will be executed to determine the api implementation
 * @param type: checks to see if a dependency is of a specific type(js|native) as well
 * @returns {Promise.<boolean>}
 */
export async function isDependencyApiImpl(
  dependency: PackagePath,
  forceYanInfo?: boolean,
  type?: string
): Promise<boolean> {
  const pkgName = await getPackageName(dependency)

  if (!type && !forceYanInfo && /^.*react-native-.+-api-impl$/.test(pkgName)) {
    return true
  }

  const modulesTypes = type
    ? [type]
    : [ModuleType.NATIVE_API_IMPL, ModuleType.JS_API_IMPL]

  const depInfo = await yarn.info(dependency, {
    field: 'ern',
  })

  return modulesTypes.indexOf(depInfo?.moduleType) > -1
}

export async function getPackageName(pkg: PackagePath) {
  if (pkg.isGitPath) {
    throw new Error(
      'getPackageName does not support git based package path yet'
    )
  }
  return pkg.name!
}

export async function isDependencyJsApiImpl(
  dependency: PackagePath
): Promise<boolean> {
  return isDependencyApiImpl(dependency, true, ModuleType.JS_API_IMPL)
}

export async function isDependencyNativeApiImpl(
  dependency: PackagePath
): Promise<boolean> {
  return isDependencyApiImpl(dependency, true, ModuleType.NATIVE_API_IMPL)
}

export async function isDependencyPathApiImpl(
  dependencyPath: string,
  type?: string
): Promise<boolean> {
  const modulesTypes = type
    ? [type]
    : [ModuleType.NATIVE_API_IMPL, ModuleType.JS_API_IMPL]

  const packageJson = await readPackageJson(dependencyPath)
  return modulesTypes.indexOf(packageJson.ern?.moduleType) > -1
}

export async function isDependencyPathJsApiImpl(
  dependencyPath: string
): Promise<boolean> {
  return isDependencyPathApiImpl(dependencyPath, ModuleType.JS_API_IMPL)
}

export async function isDependencyPathNativeApiImpl(
  dependencyPath: string,
  type?: string
): Promise<boolean> {
  return isDependencyPathApiImpl(dependencyPath, ModuleType.NATIVE_API_IMPL)
}

/**
 * Version of react-native dependency in manifest
 */
export async function reactNativeManifestVersion({
  manifestId,
}: { manifestId?: string } = {}) {
  const reactNativebasePathDependency = PackagePath.fromString('react-native')
  const reactNativeDependency = await manifest.getNativeDependency(
    reactNativebasePathDependency,
    { manifestId }
  )

  if (!reactNativeDependency) {
    throw new Error('Could not retrieve react native dependency from manifest')
  }

  return reactNativeDependency.version
}

export function isValidElectrodeNativeModuleName(name: string): boolean {
  return /^[A-Z][0-9A-Z_]*$/i.test(name)
}

/**
 * Sample plugin origin objects :
 * {
 *  "type": "git",
 *  "url": "https://github.com/aoriani/ReactNative-StackTracer.git",
 *  "version": "0.1.1"
 * }
 *
 * {
 *  "type": "npm",
 *  "name": "react-native-code-push",
 *  "version": "1.16.1-beta"
 * }
 * @param pluginOrigin
 */
export function getDownloadedPluginPath(pluginOrigin: any) {
  let downloadPath
  if (pluginOrigin.type === 'npm') {
    if (pluginOrigin.scope) {
      downloadPath = path.join(
        'node_modules',
        `@${pluginOrigin.scope}`,
        pluginOrigin.name
      )
    } else {
      downloadPath = path.join('node_modules', pluginOrigin.name)
    }
  } else if (pluginOrigin.type === 'git') {
    if (pluginOrigin.version && gitDirectoryRe.test(pluginOrigin.url)) {
      downloadPath = gitDirectoryRe.exec(pluginOrigin.url)![1]
    }
  }

  if (!downloadPath) {
    throw new Error(`Unsupported plugin origin type : ${pluginOrigin.type}`)
  }
  return downloadPath
}

/**
 * Extracts all the js api implementation dependencies from the plugin array.
 * @param plugins
 * @returns {Promise.<Array.<Dependency>>}
 */
export async function extractJsApiImplementations(plugins: PackagePath[]) {
  const jsApiImplDependencies: PackagePath[] = []
  for (const dependency of plugins) {
    if (await isDependencyJsApiImpl(dependency)) {
      jsApiImplDependencies.push(dependency)
    }
  }
  return jsApiImplDependencies
}

export function logErrorAndExitProcess(e: any, code: number = 1) {
  if (e instanceof Error) {
    log.error(`An error occurred: ${e.message && e.message.trimRight()}`)
    log.debug(e.stack!)
  } else if (e instanceof Object) {
    log.error(`An error occurred: ${JSON.stringify(e)}`)
  } else {
    log.error(`An error occurred: ${e}`)
  }

  process.exit(code)
}

export function coerceToAppNameDescriptorArray(
  v: string | AnyAppDescriptor | Array<string | AnyAppDescriptor>
): AppNameDescriptor[] {
  return v instanceof Array
    ? v.map(coerceToAppNameDescriptor)
    : [coerceToAppNameDescriptor(v)]
}

export function coerceToAppPlatformDescriptorArray(
  v:
    | string
    | AppVersionDescriptor
    | AppPlatformDescriptor
    | Array<string | AppVersionDescriptor | AppPlatformDescriptor>
): AppPlatformDescriptor[] {
  return v instanceof Array
    ? v.map(coerceToAppPlatformDescriptor)
    : [coerceToAppPlatformDescriptor(v)]
}

export function coerceToAnyAppDescriptorArray(
  v: string | AnyAppDescriptor | Array<string | AnyAppDescriptor>
) {
  return v instanceof Array
    ? v.map(coerceToAnyAppDescriptor)
    : [coerceToAnyAppDescriptor(v)]
}

export function coerceToAppVersionDescriptorArray(
  v: string | AppVersionDescriptor | Array<string | AppVersionDescriptor>
): AppVersionDescriptor[] {
  return v instanceof Array
    ? v.map(coerceToAppVersionDescriptor)
    : [coerceToAppVersionDescriptor(v)]
}

export function coerceToAppNameDescriptor(
  v: string | AnyAppDescriptor
): AppNameDescriptor {
  return typeof v === 'string'
    ? AppVersionDescriptor.fromString(v)
    : v.toAppNameDescriptor()
}

export function coerceToAppPlatformDescriptor(
  v: string | AppPlatformDescriptor | AppVersionDescriptor
): AppPlatformDescriptor {
  return typeof v === 'string'
    ? AppPlatformDescriptor.fromString(v)
    : v.toAppPlatformDescriptor()
}

export function coerceToAppVersionDescriptor(
  v: string | AppVersionDescriptor
): AppVersionDescriptor {
  return typeof v === 'string' ? AppVersionDescriptor.fromString(v) : v
}

export function coerceToAnyAppDescriptor(v: string | AnyAppDescriptor) {
  return typeof v === 'string' ? v.toAppDescriptor() : v
}

export function coerceToPackagePathArray(
  v: string | PackagePath | Array<string | PackagePath>
): PackagePath[] {
  return v instanceof Array
    ? v.map(coerceToPackagePath)
    : [coerceToPackagePath(v)]
}

export function coerceToPackagePath(v: string | PackagePath): PackagePath {
  return typeof v === 'string' ? PackagePath.fromString(v) : v
}

const gitRefBranch = (branch: string) => `refs/heads/${branch}`
const gitRefTag = (tag: string) => `refs/tags/${tag}`
const gitShaLength = 40

export async function isGitBranch(p: PackagePath): Promise<boolean> {
  if (!p.isGitPath) {
    return false
  }
  if (p.isGitPath && !p.version) {
    return true
  }
  const heads = await gitCli().listRemote(['--heads', p.basePath])
  return heads.includes(gitRefBranch(p.version!))
}

export async function isGitTag(p: PackagePath): Promise<boolean> {
  if (!p.isGitPath || !p.version) {
    return false
  }
  const tags = await gitCli().listRemote(['--tags', p.basePath])
  return tags.includes(gitRefTag(p.version))
}

export async function getCommitShaOfGitBranchOrTag(
  p: PackagePath
): Promise<string> {
  if (!p.isGitPath) {
    throw new Error(`${p} is not a git path`)
  }
  if (!p.version) {
    throw new Error(`${p} does not include a branch or tag`)
  }
  const result = await gitCli().listRemote([p.basePath, p.version])
  if (!result || result === '') {
    throw new Error(`${p.version} branch or tag not found in ${p.basePath}`)
  }
  return result.substring(0, gitShaLength)
}

export async function getCommitShaOfGitPackage(p: PackagePath) {
  if (!p.isGitPath) {
    throw new Error(`${p} is not a git path`)
  }
  if ((await isGitBranch(p)) || (await isGitTag(p))) {
    return getCommitShaOfGitBranchOrTag(p)
  }
  return p.version
}

export async function areSamePackagePathsAndVersions(
  a: PackagePath[],
  b: PackagePath[]
) {
  // If lengths are different then it cannot be same
  if (a.length !== b.length) {
    return false
  }

  // If full package paths are matching then it means
  // all package paths are using the same versions
  if (_.xorBy(a, b, 'fullPath').length === 0) {
    return true
  }

  // If one non git package path is using a different
  // version then return false
  if (
    _.xorBy(
      a.filter(p => !p.isGitPath),
      b.filter(p => !p.isGitPath),
      'fullPath'
    ).length !== 0
  ) {
    return false
  }

  // Otherwise there is only one possible case where PackagePath that
  // uses different versions are in fact pointing to identical version
  // This happens if the version is a git branch/tag or SHA
  // In that case even though the version string is different, it is
  // possible that they point to the same commit SHA
  const aGit: PackagePath[] = a.filter(p => p.isGitPath)
  const bGit: PackagePath[] = b.filter(p => p.isGitPath)
  for (const p of aGit) {
    const other = bGit.find(x => x.basePath === p.basePath)
    const aSha = await getCommitShaOfGitPackage(p)
    const bSha = await getCommitShaOfGitPackage(other!)
    if (aSha !== bSha) {
      return false
    }
  }

  return true
}
