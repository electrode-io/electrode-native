import fs from 'fs-extra'
import path from 'path'
import semver from 'semver'
import { log, readPackageJson, shell } from 'ern-core'
import { getNodeModuleVersion } from './getNodeModuleVersion'

export async function patchMetroBabelRcRoots({ cwd }: { cwd: string }) {
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

  // If React Native version is greater or equal than 0.56.0
  // it is using Babel 7
  // In that case, because we still want to process .babelrc
  // of some MiniApps that need their .babelrc to be processed
  // during bundling, we need to use the babelrcRoots option of
  // Babel 7 (https://babeljs.io/docs/en/options#babelrcroots)
  // Unfortunately, there is no way -as of metro latest version-
  // to provide this option to the metro bundler.
  // A pull request will be opened to metro to properly support
  // this option, but meanwhile, we are just directly patching the
  // metro transformer source file to make use of this option.
  // This code will be kept even when a new version of metro supporting
  // this option will be released, to keep backward compatibility.
  // It will be deprecated at some point.
  if (
    semver.gte(compositeReactNativeVersion, '0.56.0') &&
    babelRcRootsRe.length > 0
  ) {
    let pathToFileToPatch
    if (semver.lt(compositeMetroVersion, '0.51.0')) {
      // For versions of metro < 0.51.0, we are patching the reactNativeTransformer.js file
      // https://github.com/facebook/metro/blob/v0.50.0/packages/metro/src/reactNativeTransformer.js#L120
      pathToFileToPatch = path.join(
        compositeNodeModulesPath,
        'metro/src/reactNativeTransformer.js'
      )
    } else {
      // For versions of metro >= 0.51.0, we are patching the index.js file
      // https://github.com/facebook/metro/blob/v0.51.0/packages/metro-react-native-babel-transformer/src/index.js#L120
      const pathInCommunityCli = path.join(
        compositeNodeModulesPath,
        '@react-native-community/cli/node_modules/metro-react-native-babel-transformer/src/index.js'
      )
      if (await fs.pathExists(pathInCommunityCli)) {
        pathToFileToPatch = pathInCommunityCli
      } else {
        pathToFileToPatch = path.join(
          compositeNodeModulesPath,
          'metro-react-native-babel-transformer/src/index.js'
        )
      }
    }

    const fileToPatch = await fs.readFile(pathToFileToPatch)
    const lineToPatch = `let config = Object.assign({}, babelRC, extraConfig);`
    // Just add extra code line to inject babelrcRoots option

    const patch = `extraConfig.babelrcRoots = [
${babelRcRootsRe.map(b => b.toString()).join(',')} ]
${lineToPatch}`
    const patchedFile = fileToPatch.toString().replace(lineToPatch, patch)
    await fs.writeFile(pathToFileToPatch, patchedFile)
  }

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
