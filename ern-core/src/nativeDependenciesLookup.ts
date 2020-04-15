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

export interface NativeDependencies {
  apis: PackagePath[]
  nativeApisImpl: PackagePath[]
  thirdPartyInManifest: PackagePath[]
  thirdPartyNotInManifest: PackagePath[]
  all: PackagePath[]
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
  dir: string | string[],
  { manifestId }: { manifestId?: string } = {}
): Promise<NativeDependencies> {
  const dirs: string[] = Array.isArray(dir) ? dir : [dir]

  const result: NativeDependencies = {
    all: [],
    apis: [],
    nativeApisImpl: [],
    thirdPartyInManifest: [],
    thirdPartyNotInManifest: [],
  }

  for (const d of dirs) {
    const directoriesWithNativeCode = findDirectoriesContainingNativeCode(d)
    const filteredDirectories = filterDirectories(directoriesWithNativeCode)
    const packagePaths = resolvePackagePaths(filteredDirectories)

    for (const packagePath of packagePaths) {
      const pathToPackage = path.join(d, packagePath)
      const pathToNativeDependencyPackageJson = path.join(
        pathToPackage,
        'package.json'
      )
      const nativeDepPackageJson = require(pathToNativeDependencyPackageJson)
      const dep = PackagePath.fromString(pathToPackage)
      if (nativeDepPackageJson.ern) {
        if (
          nativeDepPackageJson.ern.moduleType === ModuleTypes.API ||
          /react-native-.+-api$/.test(dep.name!)
        ) {
          result.apis.push(dep)
        } else if (
          nativeDepPackageJson.ern.moduleType === ModuleTypes.NATIVE_API_IMPL
        ) {
          result.nativeApisImpl.push(dep)
        }
      } else {
        if (await manifest.getNativeDependency(dep, { manifestId })) {
          result.thirdPartyInManifest.push(dep)
        } else {
          result.thirdPartyNotInManifest.push(dep)
        }
      }
      result.all.push(dep)
    }
  }

  return result
}

export async function getNativeDependencyPath(dir: string, d: PackagePath) {
  const dependencies = await findNativeDependencies(dir)
  const dependency: PackagePath | undefined = dependencies.all.find(
    x => x.name === d.name
  )
  return dependency?.basePath
}
