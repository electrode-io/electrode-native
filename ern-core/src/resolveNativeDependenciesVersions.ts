import semver from 'semver'
import _ from 'lodash'
import { NativeDependencies } from './nativeDependenciesLookup'
import { PackagePath } from './PackagePath'

export function containsVersionMismatch(
  versions: string[],
  mismatchLevel: 'major' | 'minor' | 'patch'
): boolean {
  const minVersion = semver.minSatisfying(versions, '*')
  const maxVersion = semver.maxSatisfying(versions, '*')
  const majorMismatch = semver.major(maxVersion) !== semver.major(minVersion)
  const minorMismatch = semver.minor(maxVersion) !== semver.minor(minVersion)
  const patchMismatch = semver.patch(maxVersion) !== semver.patch(minVersion)
  return (
    majorMismatch ||
    (minorMismatch &&
      (mismatchLevel === 'minor' || mismatchLevel === 'patch')) ||
    (patchMismatch && mismatchLevel === 'patch')
  )
}

export function retainHighestVersions(
  dependenciesA: PackagePath[],
  dependenciesB: PackagePath[]
): PackagePath[] {
  const result: PackagePath[] = []
  const groups = _.groupBy([...dependenciesA, ...dependenciesB], 'basePath')
  let dependencyGroup: any
  for (dependencyGroup of Object.values(groups)) {
    let highestVersionDependency = dependencyGroup[0]
    if (
      dependencyGroup.length > 1 &&
      semver.gt(dependencyGroup[1].version, dependencyGroup[0].version)
    ) {
      highestVersionDependency = dependencyGroup[1]
    }
    result.push(highestVersionDependency)
  }
  return result
}

export function resolvePackageVersionsGivenMismatchLevel(
  plugins: PackagePath[],
  mismatchLevel: 'major' | 'minor' | 'patch'
): {
  resolved: PackagePath[]
  pluginsWithMismatchingVersions: string[]
} {
  const result: any = {
    pluginsWithMismatchingVersions: [],
    resolved: [],
  }

  const pluginsByBasePath = _.groupBy(
    _.unionBy(plugins, p => p.toString()),
    'basePath'
  )

  for (const basePath of Object.keys(pluginsByBasePath)) {
    const entry = pluginsByBasePath[basePath]
    const pluginVersions = _.map(entry, 'version')
    if (pluginVersions.length > 1) {
      // If there are multiple versions of the dependency
      if (containsVersionMismatch(<string[]>pluginVersions, mismatchLevel)) {
        // If at least one of the versions major digit differs, deem incompatibility
        result.pluginsWithMismatchingVersions.push(basePath)
      } else {
        // No mismatchLevel version differences, just return the highest version
        result.resolved.push(
          _.find(
            entry,
            c =>
              c.basePath === basePath &&
              c.version === semver.maxSatisfying(<string[]>pluginVersions, '*')
          )
        )
      }
    } else {
      // Only one version is used across all MiniApps, just use this version
      result.resolved.push(entry[0])
    }
  }

  return result
}

export function resolveNativeDependenciesVersions(
  nativeDependenciesArr: NativeDependencies[]
): any {
  const aggregateNativeDependencies: NativeDependencies = {
    all: [],
    apis: [],
    nativeApisImpl: [],
    thirdPartyInManifest: [],
    thirdPartyNotInManifest: [],
  }

  // Build a map of all the native dependencies of each of the MiniApps
  for (const nativeDependencies of nativeDependenciesArr) {
    aggregateNativeDependencies.apis.push(...nativeDependencies.apis)
    aggregateNativeDependencies.nativeApisImpl.push(
      ...nativeDependencies.nativeApisImpl
    )
    aggregateNativeDependencies.thirdPartyInManifest.push(
      ...nativeDependencies.thirdPartyInManifest
    )
    if (aggregateNativeDependencies.thirdPartyNotInManifest.length > 0) {
      aggregateNativeDependencies.thirdPartyNotInManifest.push(
        ...nativeDependencies.thirdPartyNotInManifest
      )
    }
  }

  return resolveNativeDependenciesVersionsEx(aggregateNativeDependencies)
}

export function resolveNativeDependenciesVersionsEx(
  dependencies: NativeDependencies
) {
  // Resolve native dependencies versions of APIs / APIs impls
  let apisAndApiImplsNativeDeps: PackagePath[] = []
  if (dependencies.apis.length > 0) {
    apisAndApiImplsNativeDeps.push(
      ..._.flatten(dependencies.apis.map(x => x.packagePath))
    )
  }
  if (dependencies.nativeApisImpl.length > 0) {
    apisAndApiImplsNativeDeps.push(
      ..._.flatten(dependencies.nativeApisImpl.map(x => x.packagePath))
    )
  }
  apisAndApiImplsNativeDeps = _.flatten(apisAndApiImplsNativeDeps)
  const apiAndApiImplsResolvedVersions = resolvePackageVersionsGivenMismatchLevel(
    apisAndApiImplsNativeDeps,
    'major'
  )

  // Resolve native dependencies versions third party native modules
  let thirdPartyNativeModules: PackagePath[] = []
  if (dependencies.thirdPartyInManifest.length > 0) {
    thirdPartyNativeModules.push(
      ..._.flatten(dependencies.thirdPartyInManifest.map(x => x.packagePath))
    )
  }
  if (dependencies.thirdPartyNotInManifest.length > 0) {
    thirdPartyNativeModules.push(
      ..._.flatten(dependencies.thirdPartyNotInManifest.map(x => x.packagePath))
    )
  }
  thirdPartyNativeModules = _.flatten(thirdPartyNativeModules)
  const thirdPartyNativeModulesResolvedVersions = resolvePackageVersionsGivenMismatchLevel(
    thirdPartyNativeModules,
    'patch'
  )

  return {
    pluginsWithMismatchingVersions: [
      ...apiAndApiImplsResolvedVersions.pluginsWithMismatchingVersions,
      ...thirdPartyNativeModulesResolvedVersions.pluginsWithMismatchingVersions,
    ],
    resolved: [
      ...apiAndApiImplsResolvedVersions.resolved,
      ...thirdPartyNativeModulesResolvedVersions.resolved,
    ],
  }
}
