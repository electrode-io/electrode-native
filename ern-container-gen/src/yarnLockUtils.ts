import { PackagePath } from 'ern-core'

/**
 * Builds a regular expression matching a top level registry
 * based dependency as recorded by a yarn.lock file.
 * Two groups are captured by this RegEx :
 * - 1: Name of the dependency (as seen in package.json)
 * - 2: Version of the dependency (as seen in package.json)
 *
 * Sample yarn.lock entry:
 * my-miniapp@0.8.3:
 * groups[1] : my-miniapp
 * groups[2] : 0.8.3
 * @param dep The dependency to build a Regular Expression for
 */
export function getYarnLockTopLevelRegistryDependencyRe(
  dep: PackagePath
): RegExp {
  return new RegExp(`\n(${dep.basePath})@(.+):`)
}

/**
 * Builds a regular expression matching a top level git
 * based dependency as recorded by a yarn.lock file.
 * Two groups are captured by this RegEx :
 * - 1: Name of the dependency (as seen in package.json)
 * - 2: Version of the dependency (as seen in package.json)
 *
 * Sample yarn.lock entry:
 * "my-miniapp@https://github.com/org/MyMiniApp.git#master":
 * groups[1] : my-miniapp
 * groups[2] : master
 * @param dep The dependency to build a Regular Expression for
 */
export function getYarnLockTopLevelGitDependencyRe(dep: PackagePath): RegExp {
  return new RegExp(`\n"(.+)@${dep.basePath}#(.+)":`)
}

export function getYarnLockTopLevelDependencyRe(dep: PackagePath): RegExp {
  return dep.isGitPath
    ? getYarnLockTopLevelGitDependencyRe(dep)
    : getYarnLockTopLevelRegistryDependencyRe(dep)
}
