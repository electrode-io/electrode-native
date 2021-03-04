import { PackagePath } from 'ern-core';
import _ from 'lodash';

/**
 * Builds a regular expression matching a top level registry
 * based dependency as recorded by a yarn.lock file.
 * Two groups are captured by this RegEx :
 * - 1: Name of the dependency (as seen in package.json)
 * - 2: Version of the dependency (as seen in package.json)
 *
 * Sample yarn.lock entry:
 * test-miniapp@0.8.3:
 * groups[1] : test-miniapp
 * groups[2] : 0.8.3
 * @param dep The dependency to build a Regular Expression for
 */
export function getYarnLockTopLevelRegistryDependencyRe(
  dep: PackagePath,
): RegExp {
  return new RegExp(`\n(${_.escapeRegExp(dep.basePath)})@(.+):`);
}

/**
 * Builds a regular expression matching a top level git
 * based dependency as recorded by a yarn.lock file.
 * Two groups are captured by this RegEx :
 * - 1: Name of the dependency (as seen in package.json)
 * - 2: Version of the dependency (as seen in package.json)
 *
 * Sample yarn.lock entry:
 * "test-miniapp@https://github.com/org/test-miniapp.git#master":
 * groups[1] : test-miniapp
 * groups[2] : master
 * @param dep The dependency to build a Regular Expression for
 */
export function getYarnLockTopLevelGitDependencyRe(dep: PackagePath): RegExp {
  return new RegExp(`\n"(.+)@${_.escapeRegExp(dep.basePath)}#(.+)":`);
}

export function getYarnLockTopLevelDependencyRe(dep: PackagePath): RegExp {
  return dep.isGitPath
    ? getYarnLockTopLevelGitDependencyRe(dep)
    : getYarnLockTopLevelRegistryDependencyRe(dep);
}
