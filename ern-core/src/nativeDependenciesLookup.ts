import { PackagePath } from './PackagePath'
import _ from 'lodash'
import path from 'path'
import { manifest } from './Manifest'
import * as ModuleTypes from './ModuleTypes'
import readDir = require('fs-readdir-recursive')

export function findDirectoriesContainingNativeCode(rootDir: string): string[] {
  return readDir(rootDir).filter(a => /.swift$|.pbxproj$|.java$/.test(a))
}

export function filterDirectories(directories: string[]): string[] {
  return _.filter(
    directories,
    d => !/sample|demo|example|appium|safari-launcher/i.test(d)
  )
}

export function getUnprefixedVersion(version: string): string {
  return version && version.startsWith('v') ? version.slice(1) : version
}

export interface NativeDependencies {
  apis: PackagePath[]
  nativeApisImpl: PackagePath[]
  thirdPartyInManifest: PackagePath[]
  thirdPartyNotInManifest: PackagePath[]
  all: PackagePath[]
}

export function resolvePackagePaths(paths: string[]): Set<string> {
  const result = new Set()
  for (const d of paths) {
    const lastIdx = d.lastIndexOf('node_modules')
    if (lastIdx === -1) {
      if (d.startsWith('@')) {
        // ex : @scoped-pkgs/pkg-native/src/code.swift
        // should return : @scoped-pkgs/pkg-native
        const pathSegments = d.split(path.sep)
        const p = path.join(pathSegments[0], pathSegments[1])
        result.add(p)
      } else {
        // ex : pkg-native/src/code.swift
        // should return : pkg-native
        const p = /^(.+?)\//.exec(d)
        result.add(p![1])
      }
    } else {
      const tmp = d.slice(lastIdx + 13)
      if (tmp.startsWith('@')) {
        // ex : @scoped-pkgs/nested/node_modules/@scope/pkg-native/src/code.swift
        // should return : @scoped-pkgs/nested/node_modules/@scope/pkg-native
        const pathSegments = tmp.split(path.sep)
        const p = path.join(
          d.substring(0, lastIdx + 13),
          pathSegments[0],
          pathSegments[1]
        )
        result.add(p)
      } else {
        // ex : @scoped-pkgs/nested/node_modules/pkg-native/src/code.swift
        // should return : @scoped-pkgs/nested/node_modules/pkg-native
        const e = /^(.+?)\//.exec(tmp)
        const p = path.join(d.substring(0, lastIdx + 13), e![1])
        result.add(p)
      }
    }
  }
  return result
}

export async function findNativeDependencies(
  dir: string
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
    const pathToNativeDependencyPackageJson = path.join(
      dir,
      packagePath,
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
        result.apis.push(dep)
      } else if (
        nativeDepPackageJson.ern.moduleType === ModuleTypes.NATIVE_API_IMPL
      ) {
        result.nativeApisImpl.push(dep)
      }
    } else {
      if (await manifest.getNativeDependency(dep)) {
        result.thirdPartyInManifest.push(dep)
      } else {
        result.thirdPartyNotInManifest.push(dep)
      }
    }
    result.all.push(dep)
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
