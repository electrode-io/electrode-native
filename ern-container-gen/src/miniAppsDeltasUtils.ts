import { log, PackagePath, yarn } from 'ern-core'
import {
  getYarnLockTopLevelDependencyRe,
  getYarnLockTopLevelGitDependencyRe,
} from './yarnLockUtils'
import _ from 'lodash'

/**
 * Represent the changes (deltas) in term of MiniApps versions
 * between two sets (reference and comparand)
 */
export interface MiniAppsDeltas {
  /**
   * MiniApps that are not present in the reference set but are
   * present in the comparand.
   */
  new?: PackagePath[]
  /**
   * MiniApps that are present in both sets with the same version.
   */
  same?: PackagePath[]
  /**
   * Miniapps that are present in both sets but with different versions.
   * The version of the MiniApps in this array reflects the version of
   * the comparand (i.e target upgrade verison), not the reference.
   * NOTE: The term `upgraded` is misleading here.
   */
  upgraded?: PackagePath[]
}

/**
 *  Using a yarn.lock file content as reference to figure out deltas, group the MiniApps as follow :
 * - 'new' : The MiniApp is a new one (it was not part of previously generated composite)
 * - 'same' : The MiniApp is the same (it was part of previously generated composite, with same version)
 * - 'upgraded' : The MiniApp has a new version (it was part of previously generated composite, but with a different version)
 */
export function getMiniAppsDeltas(
  miniApps: PackagePath[],
  yarnlock: string
): MiniAppsDeltas {
  return _.groupBy(miniApps, (m: PackagePath) => {
    const re = getYarnLockTopLevelDependencyRe(m)
    const match = re.exec(yarnlock)
    if (match === null) {
      return 'new'
    } else {
      return match[2 /*version*/] === m.version ? 'same' : 'upgraded'
    }
  })
}

/**
 * Generate package.json dependencies object based on MiniApp deltas.
 * The object will contain the same MiniApps at the same versions that were
 * used to generate the provided yarn.lock, so that we get back to original state
 * conforming with yarn.lock
 * It only contains 'same' and 'upgrade' MiniApps (not new ones)
 */
export function getPackageJsonDependenciesUsingMiniAppDeltas(
  miniAppsDeltas: MiniAppsDeltas,
  yarnlock: string
) {
  const result = {}

  if (miniAppsDeltas.same) {
    for (const m of miniAppsDeltas.same) {
      if (m.isRegistryPath) {
        // Sample package.json entry :
        // "my-miniapp": "0.8.3"
        result[m.basePath] = m.version
      } else if (m.isGitPath) {
        // For a git based dependency, the name of the dependency as
        // seen in package.json is not know by the PackagePath object
        // Only way to find the name of the dependency is to look in
        // the yarn.lock file as it records the name of git based dependencies
        const name = getYarnLockTopLevelGitDependencyRe(m).exec(
          yarnlock
        )![1 /*name*/]
        // Sample package.json entry :
        // "my-miniapp": "https://github.com/org/MyMiniApp.git#master"
        result[name] = m.fullPath
      }
    }
  }

  if (miniAppsDeltas.upgraded) {
    for (const m of miniAppsDeltas.upgraded) {
      const re = getYarnLockTopLevelDependencyRe(m)
      const initialVersion = re.exec(yarnlock)![2 /*version*/]
      // Please see comment above, in miniAppsDeltas.same to understand
      // the distinction between registry v.s git dependency.
      if (m.isRegistryPath) {
        result[m.basePath] = initialVersion
      } else if (m.isGitPath) {
        const name = getYarnLockTopLevelGitDependencyRe(m).exec(
          yarnlock
        )![1 /*name*/]
        result[name] = `${m.basePath}#${initialVersion}`
      }
    }
  }

  return result
}

export async function runYarnUsingMiniAppDeltas(
  miniAppsDeltas: MiniAppsDeltas
) {
  //
  // Now we can `yarn add` for new MiniApps
  if (miniAppsDeltas.new) {
    for (const newMiniAppVersion of miniAppsDeltas.new) {
      log.debug(`Adding new MiniApp ${newMiniAppVersion.toString()}`)
      await yarn.add(newMiniAppVersion)
    }
  }

  // !!! TODO !!!
  // We run `yarn upgrade` here but that might not be the safest solution
  // as `yarn upgrade` will run a full upgrade of all dependencies of the
  // MiniApp, transitively, which might not be desired.
  // Indeed if we want to be as close to the yarn.lock as possible, running
  // `yarn add` for upgraded dependencies will only upgrade the MiniApp
  // version but will leave its dependency graph untouched, based
  // on yarn.lock.
  // It might be better to given more control to the MiniApp team on
  // dependency control.
  if (miniAppsDeltas.upgraded) {
    for (const upgradedMiniAppVersion of miniAppsDeltas.upgraded) {
      log.debug(`Upgrading MiniApp ${upgradedMiniAppVersion.toString()}`)
      // TODO : Once again ... Do we really want upgrade here ?
      await yarn.upgrade(upgradedMiniAppVersion)
    }
  }

  //
  // If the MiniApp is at the same version, we don't really need
  // to run `yarn add`. There is one exception to this rule however,
  // if the MiniApp package path is git based, we want to run `yarn add`
  // even if the version is the same. This is because the version can
  // be a branch or a tag name (we have no way to distinguish between the
  // two yet). While tags are precise immutable versions, branches however
  // are mutable, and even if the branch name hasn't changed, the code
  // on the branch might have. That is why we run `yarn add` in this case.
  if (miniAppsDeltas.same) {
    for (const sameMiniAppVersion of miniAppsDeltas.same) {
      if (sameMiniAppVersion.isGitPath) {
        log.debug(
          `Re-adding git based MiniApp ${sameMiniAppVersion.toString()}`
        )
        await yarn.add(sameMiniAppVersion)
      }
    }
  }
}
