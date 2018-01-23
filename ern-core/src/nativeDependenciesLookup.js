// @flow

import PackagePath from './PackagePath'
import readDir from 'fs-readdir-recursive'
import _ from 'lodash'
import path from 'path'
import manifest from './Manifest'
import * as ModuleTypes from './ModuleTypes'

export function findDirectoriesContainingNativeCode (rootDir: string) : Array<string> {
  return readDir(rootDir).filter(a => /.swift$|.java$/.test(a))
}

export function filterDirectories (directories: Array<string>) : Array<string> {
  return _.filter(directories, d => !/sample|demo|example/i.test(d))
}

export function getUnprefixedVersion (version: string) : string {
  return version && version.startsWith('v') ? version.slice(1) : version
}

export type NativeDependencies = {
  apis: Array<PackagePath>;
  nativeApisImpl: Array<PackagePath>;
  thirdPartyInManifest: Array<PackagePath>;
  thirdPartyNotInManifest: Array<PackagePath>;
  all: Array<PackagePath>;
}

export async function findNativeDependencies (dir: string) : Promise<NativeDependencies> {
  const nativeDependenciesNames = new Set()

  const directoriesWithNativeCode = findDirectoriesContainingNativeCode(dir)
  const filteredDirectories = filterDirectories(directoriesWithNativeCode)

  for (const nativeDepsDirectory of filteredDirectories) {
    const r = /^win/.test(process.platform)
      ? /^(@.*?\\.*?)\\|^(.*?)\\/.exec(nativeDepsDirectory)
      : /^(@.*?\/.*?)\/|^(.*?)\//.exec(nativeDepsDirectory)
    nativeDependenciesNames.add(r[1] || r[2])
  }

  const result : NativeDependencies = {
    apis: [],
    nativeApisImpl: [],
    thirdPartyInManifest: [],
    thirdPartyNotInManifest: [],
    all: []
  }

  const NPM_SCOPED_MODULE_RE = /@(.*)\/(.*)/
  for (const nativeDependencyName of nativeDependenciesNames) {
    const pathToNativeDependencyPackageJson = path.join(dir, nativeDependencyName, 'package.json')
    const nativeDepPackageJson = require(pathToNativeDependencyPackageJson)
    const name = NPM_SCOPED_MODULE_RE.test(nativeDependencyName) ? NPM_SCOPED_MODULE_RE.exec(nativeDependencyName)[2] : nativeDependencyName
    const scope = (NPM_SCOPED_MODULE_RE.test(nativeDependencyName) && NPM_SCOPED_MODULE_RE.exec(nativeDependencyName)[1]) || undefined
    const version = getUnprefixedVersion(nativeDepPackageJson.version)
    const dep = packagePathFrom(name, { scope, version })
    if (nativeDepPackageJson.ern) {
      if ((nativeDepPackageJson.ern.moduleType === ModuleTypes.API) ||
          (/react-native-.+-api$/.test(dep.basePath))) {
        result.apis.push(dep)
      } else if (nativeDepPackageJson.ern.moduleType === ModuleTypes.NATIVE_API_IMPL) {
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

function packagePathFrom (name, {
  scope,
  version
} : {
  scope?: string,
  version?: string
} = {}) : PackagePath {
  return PackagePath.fromString(`${scope ? `@${scope}/` : ''}${name}${version ? `@${version}` : ''}`)
}
