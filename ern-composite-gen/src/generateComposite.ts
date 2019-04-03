import {
  log,
  PackagePath,
  shell,
  yarn,
  readPackageJson,
  writePackageJson,
  fileUtils,
} from 'ern-core'
import { cleanupCompositeDir } from './cleanupCompositeDir'
import {
  MiniAppsDeltas,
  getMiniAppsDeltas,
  getPackageJsonDependenciesUsingMiniAppDeltas,
  runYarnUsingMiniAppDeltas,
} from './miniAppsDeltasUtils'
import { runAfterCompositeGenerationScript } from './runAfterCompositeGenerationScript'
import fs from 'fs'
import path from 'path'
import semver from 'semver'
import _ from 'lodash'

export async function generateComposite(
  miniappsPaths: PackagePath[],
  outDir: string,
  {
    pathToYarnLock,
    extraJsDependencies = [],
  }: {
    pathToYarnLock?: string
    extraJsDependencies?: PackagePath[]
  } = {},
  jsApiImplDependencies?: PackagePath[]
) {
  if (fs.existsSync(outDir)) {
    cleanupCompositeDir(outDir)
  } else {
    shell.mkdir('-p', outDir)
  }

  const jsPackages = jsApiImplDependencies
    ? [...miniappsPaths, ...jsApiImplDependencies]
    : miniappsPaths

  shell.pushd(outDir)

  try {
    let compositePackageJson: any = {}

    if (pathToYarnLock && _.some(jsPackages, p => p.isFilePath)) {
      log.warn(
        'Yarn lock will not be used as some of the MiniApp paths are file based'
      )
      pathToYarnLock = undefined
    }

    if (pathToYarnLock) {
      if (_.some(jsPackages, m => !m.version)) {
        throw new Error(
          '[generateComposite] When providing a yarn lock you cannot pass MiniApps without an explicit version'
        )
      }

      if (!fs.existsSync(pathToYarnLock)) {
        throw new Error(
          `[generateComposite] Path to yarn.lock does not exist (${pathToYarnLock})`
        )
      }

      log.debug(`Copying yarn.lock to ${outDir}`)
      shell.cp(pathToYarnLock, path.join(outDir, 'yarn.lock'))

      const yarnLock = fs.readFileSync(pathToYarnLock, 'utf8')
      const miniAppsDeltas: MiniAppsDeltas = getMiniAppsDeltas(
        jsPackages,
        yarnLock
      )

      log.debug(
        `[generateComposite] miniAppsDeltas: ${JSON.stringify(miniAppsDeltas)}`
      )

      compositePackageJson.dependencies = getPackageJsonDependenciesUsingMiniAppDeltas(
        miniAppsDeltas,
        yarnLock
      )
      compositePackageJson.scripts = {
        start: 'node node_modules/react-native/local-cli/cli.js start',
      }

      log.debug(JSON.stringify(compositePackageJson.dependencies, null, 2))

      await writePackageJson(outDir, compositePackageJson)

      // Now that the composite package.json is similar to the one used to generated yarn.lock
      // we can run yarn install to get back to the exact same dependency graph as the previously
      // generated composite
      await yarn.install()
      await runYarnUsingMiniAppDeltas(miniAppsDeltas)
    } else {
      // No yarn.lock path was provided, just add miniapps one by one
      log.debug('[generateComposite] no yarn lock provided')
      await yarn.init()
      for (const miniappPath of jsPackages) {
        await yarn.add(miniappPath)
      }

      const packageJson = await readPackageJson(outDir)
      packageJson.scripts = {
        start: 'node node_modules/react-native/local-cli/cli.js start',
      }
      await writePackageJson(outDir, packageJson)
    }

    for (const extraJsDependency of extraJsDependencies) {
      await yarn.add(extraJsDependency)
    }

    let entryIndexJsContent = ''

    const dependencies: string[] = []
    compositePackageJson = await readPackageJson('.')
    for (const dependency of Object.keys(compositePackageJson.dependencies)) {
      entryIndexJsContent += `import '${dependency}'\n`
      dependencies.push(dependency)
    }

    await runAfterCompositeGenerationScript(outDir)

    const compositeNodeModulesPath = path.join(outDir, 'node_modules')

    // Any dependency that has the useBabelRc set in their package.json
    // as follow ...
    //
    // "ern": {
    //   "useBabelRc": true
    // }
    //
    // ... is added to the babelRcRoots array, so that we can properly
    // configure Babel to process the .babelrc of these dependencies.
    const babelRcRoots: string[] = []
    for (const dependency of dependencies) {
      if (fs.existsSync(path.join(compositeNodeModulesPath, dependency))) {
        const depPackageJson = await readPackageJson(
          path.join(compositeNodeModulesPath, dependency)
        )
        if (depPackageJson.ern && depPackageJson.ern.useBabelRc === true) {
          babelRcRoots.push(`./node_modules/${dependency}`)
        }
      }
    }

    const pathToMetroNodeModuleDir = path.join(
      compositeNodeModulesPath,
      'metro'
    )
    let metroPackageJson
    if (fs.existsSync(pathToMetroNodeModuleDir)) {
      metroPackageJson = await readPackageJson(pathToMetroNodeModuleDir)
    }
    const metroVersion = metroPackageJson ? metroPackageJson.version : '0.0.0'

    const pathToReactNativeNodeModuleDir = path.join(
      compositeNodeModulesPath,
      'react-native'
    )

    const reactNativePackageJson = await readPackageJson(
      pathToReactNativeNodeModuleDir
    )
    const compositeReactNativeVersion = reactNativePackageJson.version

    // To be removed as soon as react-native-cli make use of metro >= 0.52.0
    // Temporary hacky code to patch an issue present in metro 0.51.1
    // currently linked with RN 59 that impacts our bundling process
    if (metroVersion === '0.51.1') {
      const pathToFileToPatch = path.join(
        compositeNodeModulesPath,
        'metro-resolver',
        'src',
        'resolve.js'
      )
      const stringToReplace = `const assetNames = resolveAsset(dirPath, fileNameHint, platform);`
      const replacementString = `let assetNames;
      try { assetNames = resolveAsset(dirPath, fileNameHint, platform); } catch (e) {}`
      const fileToPatch = await fileUtils.readFile(pathToFileToPatch)
      const patchedFile = fileToPatch.replace(
        stringToReplace,
        replacementString
      )
      await fileUtils.writeFile(pathToFileToPatch, patchedFile)
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
      babelRcRoots.length > 0
    ) {
      let pathToFileToPatch
      if (semver.lt(metroVersion, '0.51.0')) {
        // For versions of metro < 0.51.0, we are patching the reactNativeTransformer.js file
        // https://github.com/facebook/metro/blob/v0.50.0/packages/metro/src/reactNativeTransformer.js#L120
        pathToFileToPatch = path.join(
          pathToMetroNodeModuleDir,
          'src',
          'reactNativeTransformer.js'
        )
      } else {
        // For versions of metro >= 0.51.0, we are patching the index.js file
        // https://github.com/facebook/metro/blob/v0.51.0/packages/metro-react-native-babel-transformer/src/index.js#L120
        const pathInCommunityCli = path.join(
          compositeNodeModulesPath,
          '@react-native-community',
          'cli',
          'node_modules',
          'metro-react-native-babel-transformer',
          'src',
          'index.js'
        )
        if (fs.existsSync(pathInCommunityCli)) {
          pathToFileToPatch = pathInCommunityCli
        } else {
          pathToFileToPatch = path.join(
            compositeNodeModulesPath,
            'metro-react-native-babel-transformer',
            'src',
            'index.js'
          )
        }
      }

      const fileToPatch = await fileUtils.readFile(pathToFileToPatch)
      const lineToPatch = `let config = Object.assign({}, babelRC, extraConfig);`
      // Just add extra code line to inject babelrcRoots option
      const patch = `extraConfig.babelrcRoots = ${JSON.stringify(
        babelRcRoots,
        null,
        2
      )}
${lineToPatch}`
      const patchedFile = fileToPatch.replace(lineToPatch, patch)
      await fileUtils.writeFile(pathToFileToPatch, patchedFile)
    }

    // If React Native version is less than 0.56 it is still using Babel 6.
    // In that case .babelrc files will be processed in any node_modules
    // which is not a desired behavior.
    // Therefore we just remove all .babelrc from all node_modules.
    // We only keep .babelrc of node_modules that are "whitelisted",
    // as we want them to be processed.
    if (semver.lt(compositeReactNativeVersion, '0.56.0')) {
      log.debug('Removing .babelrc files from all modules')
      if (babelRcRoots.length > 0) {
        log.debug(
          `Preserving .babelrc of whitelisted node_modules : ${JSON.stringify(
            babelRcRoots,
            null,
            2
          )}`
        )
        for (const babelRcRoot of babelRcRoots) {
          shell.cp(
            path.join(babelRcRoot, '.babelrc'),
            path.join(babelRcRoot, '.babelrcback')
          )
        }
      }
      shell.rm('-rf', path.join('node_modules', '**', '.babelrc'))
      if (babelRcRoots.length > 0) {
        for (const babelRcRoot of babelRcRoots) {
          shell.cp(
            path.join(babelRcRoot, '.babelrcback'),
            path.join(babelRcRoot, '.babelrc')
          )
        }
      }
    }

    log.debug('Creating top level composite .babelrc')
    const compositeBabelRc: { plugins: any[]; presets?: string[] } = {
      plugins: [],
    }

    // Ugly hacky way of handling module-resolver babel plugin
    // At least it has some guarantees to make it safer but its just a temporary
    // solution until we figure out a more proper way of handling this plugin
    log.debug(
      'Taking care of potential Babel module-resolver plugins used by MiniApps'
    )
    let moduleResolverAliases = {}
    for (const dependency of Object.keys(compositePackageJson.dependencies)) {
      const miniAppPackagePath = path.join(compositeNodeModulesPath, dependency)
      let miniAppPackageJson
      try {
        miniAppPackageJson = await readPackageJson(miniAppPackagePath)
      } catch (e) {
        // swallow (for test. to be fixed)
        continue
      }
      const miniAppName = miniAppPackageJson.name
      if (miniAppPackageJson.babel) {
        if (miniAppPackageJson.babel.plugins) {
          for (const babelPlugin of miniAppPackageJson.babel.plugins) {
            if (Array.isArray(babelPlugin)) {
              if (babelPlugin.includes('module-resolver')) {
                // Copy over module-resolver plugin & config to top level composite .babelrc
                log.debug(
                  `Taking care of module-resolver Babel plugin for ${miniAppName} MiniApp`
                )
                if (compositeBabelRc.plugins.length === 0) {
                  // First MiniApp to add module-resolver plugin & config
                  // easy enough, we just copy over the plugin & config
                  compositeBabelRc.plugins.push(<any>babelPlugin)
                  for (const x of babelPlugin) {
                    if (x instanceof Object && x.alias) {
                      moduleResolverAliases = x.alias
                      break
                    }
                  }
                } else {
                  // Another MiniApp  has already declared module-resolver
                  // plugin & config. If we have conflicts for aliases, we'll just abort
                  // bundling as of now to avoid generating a potentially unstable bundle
                  for (const item of babelPlugin) {
                    if (item instanceof Object && item.alias) {
                      for (const aliasKey of Object.keys(item.alias)) {
                        if (
                          moduleResolverAliases[aliasKey] &&
                          moduleResolverAliases[aliasKey] !==
                            item.alias[aliasKey]
                        ) {
                          throw new Error(
                            'Babel module-resolver alias conflict'
                          )
                        } else if (!moduleResolverAliases[aliasKey]) {
                          moduleResolverAliases[aliasKey] = item.alias[aliasKey]
                        }
                      }
                    }
                  }
                }
              } else {
                log.warn(
                  `Unsupported Babel plugin type ${babelPlugin.toString()} in ${miniAppName} MiniApp`
                )
              }
            } else {
              log.warn(
                `Unsupported Babel plugin type ${babelPlugin.toString()} in ${miniAppName} MiniApp`
              )
            }
          }
        }
        log.debug(
          `Removing babel object from ${miniAppName} MiniApp package.json`
        )
        delete miniAppPackageJson.babel
        await writePackageJson(miniAppPackagePath, miniAppPackageJson)
      }
    }

    const pathToCodePushNodeModuleDir = path.join(
      compositeNodeModulesPath,
      'react-native-code-push'
    )

    if (semver.gte(compositeReactNativeVersion, '0.57.0')) {
      compositeBabelRc.presets = ['module:metro-react-native-babel-preset']
    } else {
      compositeBabelRc.presets = ['react-native']
    }

    await fileUtils.writeFile(
      '.babelrc',
      JSON.stringify(compositeBabelRc, null, 2)
    )

    // Add support for JSX source files
    let sourceExts
    if (semver.gte(compositeReactNativeVersion, '0.57.0')) {
      sourceExts =
        "module.exports = { resolver: { sourceExts: ['jsx', 'mjs', 'js', 'ts', 'tsx'] } };"
    } else {
      sourceExts =
        "module.exports = { getSourceExts: () => ['jsx', 'mjs', 'js', 'ts', 'tsx'] }"
    }
    await fileUtils.writeFile('rn-cli.config.js', sourceExts)

    // If code push plugin is present we need to do some additional work
    if (fs.existsSync(pathToCodePushNodeModuleDir)) {
      //
      // The following code will need to be uncommented and properly reworked or included
      // in a different way, once Cart and TYP don't directly depend on code push directly
      // We will work with Cart team in that direction
      //
      // await yarn.add(codePushPlugin.name, codePushPlugin.version)
      // content += `import codePush from "react-native-code-push"\n`
      // content += `codePush.sync()`

      // We need to add some info to package.json for CodePush
      // In order to run, code push needs to find the following in package.json
      // - name & version
      // - react-native in the dependency block
      // TODO :For now we hardcode these values for demo purposes. That being said it
      // might not be needed to do something better because it seems like
      // code push is not making a real use of this data
      // Investigate further.
      // https://github.com/Microsoft/code-push/blob/master/cli/script/command-executor.ts#L1246
      compositePackageJson.dependencies[
        'react-native'
      ] = compositeReactNativeVersion
      compositePackageJson.name = 'container'
      compositePackageJson.version = '0.0.1'
      await writePackageJson('.', compositePackageJson)
    }

    log.debug('Creating index.android.js')
    await fileUtils.writeFile('index.android.js', entryIndexJsContent)
    log.debug('Creating index.ios.js')
    await fileUtils.writeFile('index.ios.js', entryIndexJsContent)
  } finally {
    shell.popd()
  }
}
