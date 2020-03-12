import fs from 'fs-extra'
import path from 'path'
import semver from 'semver'
import { log, readPackageJson, shell } from 'ern-core'
import { getNodeModuleVersion } from './getNodeModuleVersion'
import { patchMetroBabelRcRoots } from './patchMetroBabelRcRoots'

export async function patchCompositeBabelRcRoots({ cwd }: { cwd: string }) {
  const compositePackageJson = await readPackageJson(cwd)
  const compositeNodeModulesPath = path.join(cwd, 'node_modules')
  const compositeReactNativeVersion = await getNodeModuleVersion({
    cwd,
    name: 'react-native',
  })
  const compositeMetroVersion = await getNodeModuleVersion({
    cwd,
    name: 'metro',
  })
  const dependencies: string[] = Object.keys(compositePackageJson.dependencies)

  // Any dependency that has the useBabelRc set in their package.json
  // as follow ...
  //
  // "ern": {
  //   "useBabelRc": true
  // }
  //
  // ... is added to the babelRcRoots array, so that we can properly
  // configure Babel to process the .babelrc of these dependencies.
  const babelRcRootsRe: RegExp[] = []
  const babelRcRootsPaths: string[] = []
  for (const dependency of dependencies) {
    if (await fs.pathExists(path.join(compositeNodeModulesPath, dependency))) {
      const depPackageJson = await readPackageJson(
        path.join(compositeNodeModulesPath, dependency)
      )
      if (depPackageJson.ern?.useBabelRc === true) {
        babelRcRootsRe.push(new RegExp(`node_modules\/${dependency}(?!.+\/)`))
        babelRcRootsPaths.push(`./node_modules/${dependency}`)
      }
    }
  }

  await patchMetroBabelRcRoots({
    babelRcRootsRe,
    cwd,
    metroVersion: compositeMetroVersion,
    rnVersion: compositeReactNativeVersion,
  })

  // If React Native version is less than 0.56 it is still using Babel 6.
  // In that case .babelrc files will be processed in any node_modules
  // which is not a desired behavior.
  // Therefore we just remove all .babelrc from all node_modules.
  // We only keep .babelrc of node_modules that are "whitelisted",
  // as we want them to be processed.
  if (semver.lt(compositeReactNativeVersion, '0.56.0')) {
    log.debug('Removing .babelrc files from all modules')
    if (babelRcRootsPaths.length > 0) {
      log.debug(
        `Preserving .babelrc of whitelisted node_modules : ${JSON.stringify(
          babelRcRootsPaths,
          null,
          2
        )}`
      )
      for (const babelRcRoot of babelRcRootsPaths) {
        shell.cp(
          path.join(babelRcRoot, '.babelrc'),
          path.join(babelRcRoot, '.babelrcback')
        )
      }
    }
    shell.rm('-rf', path.join('node_modules', '**', '.babelrc'))
    if (babelRcRootsPaths.length > 0) {
      for (const babelRcRoot of babelRcRootsPaths) {
        shell.cp(
          path.join(babelRcRoot, '.babelrcback'),
          path.join(babelRcRoot, '.babelrc')
        )
      }
    }
  }
}
