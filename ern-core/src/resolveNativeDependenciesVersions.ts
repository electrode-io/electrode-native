import semver from 'semver'
import _ from 'lodash'
import { NativeDependencies } from './nativeDependenciesLookup'
import { PackagePath } from './PackagePath'

export function containsVersionMismatch(
  versions: string[],
  mismatchLevel: 'major' | 'minor' | 'patch'
): boolean {
  const semverVersions = versions.map(v => semver.parse(v)!)
  const hasMajorDiff = _.uniqBy(semverVersions, 'major').length > 1
  const hasMinorDiff = _.uniqBy(semverVersions, 'minor').length > 1
  const hasPatchDiff = _.uniqBy(semverVersions, 'patch').length > 1
  const hasPreReleaseDiff =
    _.uniqWith(
      semverVersions.map(v => v.prerelease),
      _.isEqual
    ).length > 1

  return mismatchLevel === 'patch'
    ? hasMajorDiff || hasMinorDiff || hasPatchDiff || hasPreReleaseDiff
    : mismatchLevel === 'minor'
    ? hasMajorDiff || hasMinorDiff || hasPreReleaseDiff
    : hasMajorDiff || hasPreReleaseDiff
}

export function retainHighestVersions(
  dependenciesA: PackagePath[],
  dependenciesB: PackagePath[]
): PackagePath[] {
  const result: PackagePath[] = []
  const groups = _.groupBy([...dependenciesA, ...dependenciesB], 'name')
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

  const pluginsByName = _.groupBy(
    _.unionBy(plugins, p => p.toString()),
    'name'
  )

  for (const name of Object.keys(pluginsByName)) {
    const entry = pluginsByName[name]
    const pluginVersions = _.map(entry, 'version')
    if (pluginVersions.length > 1) {
      // If there are multiple versions of the dependency
      if (
        (name === 'react-native-electrode-bridge' &&
          containsVersionMismatch(<string[]>pluginVersions, 'major')) ||
        containsVersionMismatch(<string[]>pluginVersions, mismatchLevel)
      ) {
        // If at least one of the versions major digit differs, deem incompatibility
        result.pluginsWithMismatchingVersions.push(name)
      } else {
        // No mismatchLevel version differences, just return the highest version
        result.resolved.push(
          _.find(
            entry,
            c =>
              c.name === name &&
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
): {
  pluginsWithMismatchingVersions: string[]
  resolved: PackagePath[]
} {
  // Resolve native dependencies versions of APIs / APIs impls
  let apisAndApiImplsNativeDeps: PackagePath[] = []
  if (dependencies.apis.length > 0) {
    apisAndApiImplsNativeDeps.push(..._.flatten(dependencies.apis))
  }
  if (dependencies.nativeApisImpl.length > 0) {
    apisAndApiImplsNativeDeps.push(..._.flatten(dependencies.nativeApisImpl))
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
      ..._.flatten(dependencies.thirdPartyInManifest)
    )
  }
  if (dependencies.thirdPartyNotInManifest.length > 0) {
    thirdPartyNativeModules.push(
      ..._.flatten(dependencies.thirdPartyNotInManifest)
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
