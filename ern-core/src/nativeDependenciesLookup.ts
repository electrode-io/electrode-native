import { PackagePath } from './PackagePath'
import _ from 'lodash'
import path from 'path'
import { manifest } from './Manifest'
import * as ModuleTypes from './ModuleTypes'
import readDir = require('fs-readdir-recursive')

const NodeModulesLen = 'node_modules'.length

export function findDirectoriesContainingNativeCode(rootDir: string): string[] {
  return readDir(rootDir)
    .filter(a => /.swift$|.pbxproj$|.java$|.framework\//.test(a))
    .filter(a => !/ElectrodeContainer.framework/.test(a))
}

export function filterDirectories(directories: string[]): string[] {
  return _.filter(
    directories,
    d => !/sample|demo|example|appium|safari-launcher/i.test(d)
  )
}

export function getUnprefixedVersion(version: string): string {
  return version?.startsWith('v') ? version.slice(1) : version
}

export interface NativeDependency {
  path: string
  packagePath: PackagePath
}

export interface NativeDependencies {
  apis: NativeDependency[]
  nativeApisImpl: NativeDependency[]
  thirdPartyInManifest: NativeDependency[]
  thirdPartyNotInManifest: NativeDependency[]
  all: NativeDependency[]
}

export function resolvePackagePaths(paths: string[]): Set<string> {
  const result = new Set<string>()
  for (const d of paths) {
    const lastIdx = d.lastIndexOf('node_modules')
    if (lastIdx === -1) {
      const pathSegments = d.split(path.sep)
      if (d.startsWith('@')) {
        // ex : @scoped-pkgs/pkg-native/src/code.swift
        // should return : @scoped-pkgs/pkg-native
        const p = path.join(pathSegments[0], pathSegments[1])
        result.add(p)
      } else {
        // ex : pkg-native/src/code.swift
        // should return : pkg-native
        result.add(pathSegments[0])
      }
    } else {
      const tmp = d.slice(lastIdx + NodeModulesLen + 1)
      const pathSegments = tmp.split(path.sep)
      if (tmp.startsWith('@')) {
        // ex : @scoped-pkgs/nested/node_modules/@scope/pkg-native/src/code.swift
        // should return : @scoped-pkgs/nested/node_modules/@scope/pkg-native
        const p = path.join(
          d.substring(0, lastIdx + NodeModulesLen + 1),
          pathSegments[0],
          pathSegments[1]
        )
        result.add(p)
      } else {
        // ex : @scoped-pkgs/nested/node_modules/pkg-native/src/code.swift
        // should return : @scoped-pkgs/nested/node_modules/pkg-native
        const p = path.join(
          d.substring(0, lastIdx + NodeModulesLen + 1),
          pathSegments[0]
        )
        result.add(p)
      }
    }
  }
  return result
}

export async function findNativeDependencies(
  dir: string,
  { manifestId }: { manifestId?: string } = {}
): Promise<NativeDependencies> {
  const directoriesWithNativeCode = findDirectoriesContainingNativeCode(dir)
  const filteredDirectories = filterDirectories(directoriesWithNativeCode)
  const packagePaths = resolvePackagePaths(filteredDirectories)

  const result: NativeDependencies = {
    all: [],
    apis: [],
    nativeApisImpl: [],
    thirdPartyInManifest: [],
    thirdPartyNotInManifest: [],
  }

  const NPM_SCOPED_MODULE_RE = /@(.*)\/(.*)/
  for (const packagePath of packagePaths) {
    const pathToPackage = path.join(dir, packagePath)
    const pathToNativeDependencyPackageJson = path.join(
      pathToPackage,
      'package.json'
    )
    const nativeDepPackageJson = require(pathToNativeDependencyPackageJson)
    const name = NPM_SCOPED_MODULE_RE.test(nativeDepPackageJson.name)
      ? NPM_SCOPED_MODULE_RE.exec(nativeDepPackageJson.name)![2]
      : nativeDepPackageJson.name
    const scope =
      (NPM_SCOPED_MODULE_RE.test(nativeDepPackageJson.name) &&
        NPM_SCOPED_MODULE_RE.exec(nativeDepPackageJson.name)![1]) ||
      undefined
    const version = getUnprefixedVersion(nativeDepPackageJson.version)
    const dep = packagePathFrom(name, { scope, version })
    if (nativeDepPackageJson.ern) {
      if (
        nativeDepPackageJson.ern.moduleType === ModuleTypes.API ||
        /react-native-.+-api$/.test(dep.basePath)
      ) {
        result.apis.push({ path: pathToPackage, packagePath: dep })
      } else if (
        nativeDepPackageJson.ern.moduleType === ModuleTypes.NATIVE_API_IMPL
      ) {
        result.nativeApisImpl.push({ path: pathToPackage, packagePath: dep })
      }
    } else {
      if (await manifest.getNativeDependency(dep, { manifestId })) {
        result.thirdPartyInManifest.push({
          packagePath: dep,
          path: pathToPackage,
        })
      } else {
        result.thirdPartyNotInManifest.push({
          packagePath: dep,
          path: pathToPackage,
        })
      }
    }
    result.all.push({ path: pathToPackage, packagePath: dep })
  }

  return result
}

function packagePathFrom(
  name,
  {
    scope,
    version,
  }: {
    scope?: string
    version?: string
  } = {}
): PackagePath {
  return PackagePath.fromString(
    `${scope ? `@${scope}/` : ''}${name}${version ? `@${version}` : ''}`
  )
}

export async function getNativeDependencyPath(dir: string, d: PackagePath) {
  const dependencies = await findNativeDependencies(dir)
  const dependency: NativeDependency | undefined = dependencies.all.find(x =>
    x.packagePath.same(d, { ignoreVersion: true })
  )
  return dependency?.path
}
