import semver from 'semver'
import _ from 'lodash'
import { PackagePath } from 'ern-core'
import { NativeDependencies } from './nativeDependenciesLookup'
import MiniApp from './MiniApp'

export function containsVersionMismatch (
  versions: Array<string>,
  mismatchLevel: 'major' | 'minor' | 'patch') : boolean {
  const minVersion = semver.minSatisfying(versions, '*')
  const maxVersion = semver.maxSatisfying(versions, '*')
  const majorMismatch = semver.major(maxVersion) !== semver.major(minVersion)
  const minorMismatch = semver.minor(maxVersion) !== semver.minor(minVersion)
  const patchMismatch = semver.patch(maxVersion) !== semver.patch(minVersion)
  return majorMismatch ||
        (minorMismatch && (mismatchLevel === 'minor' || mismatchLevel === 'patch')) ||
        (patchMismatch && mismatchLevel === 'patch')
}

export function retainHighestVersions (
  dependenciesA: Array<PackagePath>,
  dependenciesB: Array<PackagePath>) : Array<PackagePath> {
  const result : Array<PackagePath> = []
  const groups = _.groupBy([...dependenciesA, ...dependenciesB], 'basePath')
  for (const dependencyGroup of Object.values(groups)) {
    let highestVersionDependency = dependencyGroup[0]
    if ((dependencyGroup.length > 1) && (semver.gt(dependencyGroup[1].version, dependencyGroup[0].version))) {
      highestVersionDependency = dependencyGroup[1]
    }
    result.push(highestVersionDependency)
  }
  return result
}

export function resolveNativeDependenciesVersionsGivenMismatchLevel (
  plugins: Array<PackagePath>,
  mismatchLevel: 'major' | 'minor' | 'patch') : {
  resolved: Array<PackagePath>,
  pluginsWithMismatchingVersions: Array<string>
} {
  let result = {
    resolved: [],
    pluginsWithMismatchingVersions: []
  }

  let pluginsByBasePath = _.groupBy(_.unionBy(plugins, p => p.toString()), 'basePath')
  for (const basePath of Object.keys(pluginsByBasePath)) {
    const entry = pluginsByBasePath[basePath]
    const pluginVersions = _.map(entry, 'version')
    if (pluginVersions.length > 1) {
      // If there are multiple versions of the dependency
      if (containsVersionMismatch(pluginVersions, mismatchLevel)) {
        // If at least one of the versions major digit differs, deem incompatibility
        result.pluginsWithMismatchingVersions.push(basePath)
      } else {
        // No mismatchLevel version differences, just return the highest version
        result.resolved.push(_.find(entry, c => c.basePath === basePath && c.version === semver.maxSatisfying(pluginVersions, '*')))
      }
    } else {
      // Only one version is used across all MiniApps, just use this version
      result.resolved.push(entry[0])
    }
  }

  return result
}

export function resolveNativeDependenciesVersions (nativeDependenciesArr: Array<NativeDependencies>)
  : Object {
  const aggregateNativeDependencies: NativeDependencies = {
    apis: [],
    nativeApisImpl: [],
    thirdPartyInManifest: [],
    thirdPartyNotInManifest: []
  }

  // Build a map of all the native dependencies of each of the MiniApps
  for (const nativeDependencies of nativeDependenciesArr) {
    // Move react-native-electrode-bridge from nativeModulesInManifest array to nativeApisImpl array
    // as when it comes to version compatibility checks, react-native-electrode-bridge should be considered
    // in the same way as APIs and APIs implementations (it's a native module exception)
    const bridgeDep = _.remove(nativeDependencies.thirdPartyInManifest, d => d.basePath === 'react-native-electrode-bridge')
    nativeDependencies.nativeApisImpl = nativeDependencies.nativeApisImpl.concat(bridgeDep)
    aggregateNativeDependencies.apis.push(nativeDependencies.apis)
    aggregateNativeDependencies.nativeApisImpl.push(nativeDependencies.nativeApisImpl)
    aggregateNativeDependencies.thirdPartyInManifest.push(nativeDependencies.thirdPartyInManifest)
    if (aggregateNativeDependencies.thirdPartyNotInManifest.length > 0) {
      aggregateNativeDependencies.thirdPartyNotInManifest.push(nativeDependencies.thirdPartyNotInManifest)
    }
  }

  // Resolve native dependencies versions of APIs / APIs impls
  let apisAndApiImplsNativeDeps : Array<PackagePath> = []
  if (aggregateNativeDependencies.apis.length > 0) {
    apisAndApiImplsNativeDeps.push(_.flatten(aggregateNativeDependencies.apis))
  }
  if (aggregateNativeDependencies.nativeApisImpl.length > 0) {
    apisAndApiImplsNativeDeps.push(_.flatten(aggregateNativeDependencies.nativeApisImpl))
  }
  apisAndApiImplsNativeDeps = _.flatten(apisAndApiImplsNativeDeps)
  const apiAndApiImplsResolvedVersions = resolveNativeDependenciesVersionsGivenMismatchLevel(apisAndApiImplsNativeDeps, 'major')

  // Resolve native dependencies versions third party native modules
  let thirdPartyNativeModules : Array<PackagePath> = []
  if (aggregateNativeDependencies.thirdPartyInManifest.length > 0) {
    thirdPartyNativeModules.push(_.flatten(aggregateNativeDependencies.thirdPartyInManifest))
  }
  if (aggregateNativeDependencies.thirdPartyNotInManifest.length > 0) {
    thirdPartyNativeModules.push(_.flatten(aggregateNativeDependencies.thirdPartyNotInManifest))
  }
  thirdPartyNativeModules = _.flatten(thirdPartyNativeModules)
  const thirdPartyNativeModulesResolvedVersions = resolveNativeDependenciesVersionsGivenMismatchLevel(thirdPartyNativeModules, 'patch')

  return {
    resolved: [ ...apiAndApiImplsResolvedVersions.resolved, ...thirdPartyNativeModulesResolvedVersions.resolved ],
    pluginsWithMismatchingVersions: [ ...apiAndApiImplsResolvedVersions.pluginsWithMismatchingVersions, ...thirdPartyNativeModulesResolvedVersions.pluginsWithMismatchingVersions ]
  }
}

export async function resolveNativeDependenciesVersionsOfMiniApps (miniapps: Array<MiniApp>) : Promise<Object> {
  let nativeDependenciesArray = []
  for (const miniapp of miniapps) {
    const miniappNativeDependencies = await miniapp.getNativeDependencies()
    nativeDependenciesArray.push(miniappNativeDependencies)
  }

  return resolveNativeDependenciesVersions(nativeDependenciesArray)
}
