// @flow

import Dependency from './Dependency'
import readDir from 'fs-readdir-recursive'
import _ from 'lodash'
import path from 'path'

const NPM_SCOPED_MODULE_RE = /@(.*)\/(.*)/
const API_PATH_RE = /^win/.test(process.platform) ? /react-native-.+-api\\/ : /react-native-.+-api\//

export default function findNativeDependencies (p: string) : Array<Dependency> {
  let result = []

  const nativeDependenciesNames = new Set()

  const nodeModulesDirectoriesWithNativeCode = readDir(p)
          .filter(a =>
            a.includes('build.gradle') ||
            a.includes('.pbxproj') ||
            API_PATH_RE.test(a))

  // By convention we only assume react native plugins to be in directories
  // which names are starting with 'react-native' (excluding scope)
  const nativeDepsDirectories = _.filter(nodeModulesDirectoriesWithNativeCode,
          d => d.includes('react-native') && !/sample|demo|example/i.test(d))

  for (const nativeDepsDirectory of nativeDepsDirectories) {
    const pathSegments = nativeDepsDirectory.split(path.sep)
    if (pathSegments[0].startsWith('@')) {
      nativeDependenciesNames.add(`${pathSegments[0]}/${pathSegments[1]}`)
    } else {
      nativeDependenciesNames.add(pathSegments[0])
    }
  }

  // Get associated versions
  for (const nativeDependencyName of nativeDependenciesNames) {
    const pathToNativeDependencyPackageJson = path.join(p, nativeDependencyName, 'package.json')
    const nativeDepPackageJson = require(pathToNativeDependencyPackageJson)
    if (NPM_SCOPED_MODULE_RE.test(nativeDependencyName)) {
      result.push(new Dependency(NPM_SCOPED_MODULE_RE.exec(nativeDependencyName)[2], {
        scope: NPM_SCOPED_MODULE_RE.exec(nativeDependencyName)[1],
        version: nativeDepPackageJson.version.startsWith('v')
                            ? nativeDepPackageJson.version.slice(1)
                            : nativeDepPackageJson.version
      }))
    } else {
      result.push(new Dependency(nativeDependencyName, {
        version: nativeDepPackageJson.version.startsWith('v')
                            ? nativeDepPackageJson.version.slice(1)
                            : nativeDepPackageJson.version
      }))
    }
  }

  return result
}
