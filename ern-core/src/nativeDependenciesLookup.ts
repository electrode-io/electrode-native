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
  return _.filter(directories, d => !/sample|demo|example/i.test(d))
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

export async function findNativeDependencies(
  dir: string
): Promise<NativeDependencies> {
  const nativeDependenciesNames = new Set()

  const directoriesWithNativeCode = findDirectoriesContainingNativeCode(dir)
  const filteredDirectories = filterDirectories(directoriesWithNativeCode)

  for (const nativeDepsDirectory of filteredDirectories) {
    const r = /^win/.test(process.platform)
      ? /^(@.*?\\.*?)\\|^(.*?)\\/.exec(nativeDepsDirectory)
      : /^(@.*?\/.*?)\/|^(.*?)\//.exec(nativeDepsDirectory)
    if (r) {
      if (r[1]) {
        nativeDependenciesNames.add(
          /^win/.test(process.platform) ? r[1].replace('\\', '/') : r[1]
        )
      } else {
        nativeDependenciesNames.add(r[2])
      }
    }
  }

  const result: NativeDependencies = {
    all: [],
    apis: [],
    nativeApisImpl: [],
    thirdPartyInManifest: [],
    thirdPartyNotInManifest: [],
  }

  const NPM_SCOPED_MODULE_RE = /@(.*)\/(.*)/
  for (const nativeDependencyName of Array.from(nativeDependenciesNames)) {
    const pathToNativeDependencyPackageJson = path.join(
      dir,
      nativeDependencyName,
      'package.json'
    )
    const nativeDepPackageJson = require(pathToNativeDependencyPackageJson)
    const name = NPM_SCOPED_MODULE_RE.test(nativeDependencyName)
      ? NPM_SCOPED_MODULE_RE.exec(nativeDependencyName)![2]
      : nativeDependencyName
    const scope =
      (NPM_SCOPED_MODULE_RE.test(nativeDependencyName) &&
        NPM_SCOPED_MODULE_RE.exec(nativeDependencyName)![1]) ||
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
