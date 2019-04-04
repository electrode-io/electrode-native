import {
  gitCli,
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
import fs from 'fs'
import path from 'path'
import semver from 'semver'
import _ from 'lodash'
import { CompositeGeneratorConfig } from './types'

export async function generateComposite(config: CompositeGeneratorConfig) {
  log.debug(`generateComposite config : ${JSON.stringify(config, null, 2)}`)

  return config.baseComposite
    ? generateCompositeFromBase(
        config.miniApps,
        config.outDir,
        config.baseComposite,
        {
          extraJsDependencies: config.extraJsDependencies,
          jsApiImplDependencies: config.jsApiImplDependencies,
        }
      )
    : generateFullComposite(config.miniApps, config.outDir, {
        extraJsDependencies: config.extraJsDependencies,
        jsApiImplDependencies: config.jsApiImplDependencies,
        pathToYarnLock: config.pathToYarnLock,
      })
}

async function generateCompositeFromBase(
  miniApps: PackagePath[],
  outDir: string,
  baseComposite: PackagePath,
  {
    extraJsDependencies = [],
    jsApiImplDependencies,
  }: {
    extraJsDependencies?: PackagePath[]
    jsApiImplDependencies?: PackagePath[]
  } = {}
) {
  if (baseComposite.isRegistryPath) {
    throw new Error(
      `baseComposite can only be a file or git path (${baseComposite})`
    )
  }

  if (fs.existsSync(outDir) && fs.readdirSync(outDir).length > 0) {
    throw new Error(
      `${outDir} directory exists and is not empty.
Composite output directory should either not exist (it will be created) or should be empty.`
    )
  } else {
    shell.mkdir('-p', outDir)
  }

  if (baseComposite.isGitPath) {
    await gitCli().clone(baseComposite.basePath, outDir)
    if (baseComposite.version) {
      await gitCli(outDir).checkout(baseComposite.version)
    }
  } else {
    shell.cp('-Rf', path.join(baseComposite.basePath, '{.*,*}'), outDir)
  }

  const jsPackages = jsApiImplDependencies
    ? [...miniApps, ...jsApiImplDependencies]
    : miniApps

  shell.pushd(outDir)
  try {
    await installJsPackagesWithoutYarnLock({ jsPackages, outDir })
    await createCompositeImportsJsBasedOnPackageJson({ outDir })
    if (extraJsDependencies) {
      await installExtraJsDependencies({ outDir, extraJsDependencies })
    }
    await patchMetro51({ outDir })
  } finally {
    shell.popd()
  }
}

async function generateFullComposite(
  miniApps: PackagePath[],
  outDir: string,
  {
    extraJsDependencies = [],
    jsApiImplDependencies,
    pathToYarnLock,
  }: {
    extraJsDependencies?: PackagePath[]
    jsApiImplDependencies?: PackagePath[]
    pathToYarnLock?: string
  } = {}
) {
  if (fs.existsSync(outDir)) {
    cleanupCompositeDir(outDir)
  } else {
    shell.mkdir('-p', outDir)
  }

  shell.pushd(outDir)

  try {
    await installJsPackages({
      jsApiImplDependencies,
      miniApps,
      outDir,
      pathToYarnLock,
    })
    await addStartScriptToPackageJson({ outDir })
    await createIndexJsBasedOnPackageJson({ outDir })
    if (extraJsDependencies) {
      await installExtraJsDependencies({ outDir, extraJsDependencies })
    }
    await addBabelrcRoots({ outDir })
    await patchMetro51({ outDir })
    await createCompositeBabelRc({ outDir })
    await createRnCliConfig({ outDir })
    await patchPackageJsonForCodePush({ outDir })
  } finally {
    shell.popd()
  }
}

async function installJsPackagesUsingYarnLock({
  outDir,
  pathToYarnLock,
  jsPackages,
}: {
  outDir: string
  pathToYarnLock: string
  jsPackages: PackagePath[]
}) {
  const compositePackageJson: any = {}

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
  const miniAppsDeltas: MiniAppsDeltas = getMiniAppsDeltas(jsPackages, yarnLock)

  log.debug(
    `[generateComposite] miniAppsDeltas: ${JSON.stringify(miniAppsDeltas)}`
  )

  compositePackageJson.dependencies = getPackageJsonDependenciesUsingMiniAppDeltas(
    miniAppsDeltas,
    yarnLock
  )

  await writePackageJson(outDir, compositePackageJson)

  // Now that the composite package.json is similar to the one used to generated yarn.lock
  // we can run yarn install to get back to the exact same dependency graph as the previously
  // generated composite
  await yarn.install()
  await runYarnUsingMiniAppDeltas(miniAppsDeltas)
}

async function installJsPackagesWithoutYarnLock({
  outDir,
  jsPackages,
}: {
  outDir: string
  jsPackages: PackagePath[]
}) {
  // No yarn.lock path was provided, just add miniapps one by one
  log.debug('[generateComposite] no yarn lock provided')
  await yarn.init()
  for (const miniappPath of jsPackages) {
    await yarn.add(miniappPath)
  }
}

async function createIndexJsBasedOnPackageJson({ outDir }) {
  let entryIndexJsContent = ''

  const dependencies: string[] = []
  const compositePackageJson = await readPackageJson(outDir)
  for (const dependency of Object.keys(compositePackageJson.dependencies)) {
    entryIndexJsContent += `import '${dependency}'\n`
    dependencies.push(dependency)
  }

  await fileUtils.writeFile(
    path.join(outDir, 'index.android.js'),
    entryIndexJsContent
  )
  await fileUtils.writeFile(
    path.join(outDir, 'index.ios.js'),
    entryIndexJsContent
  )
}

async function createCompositeImportsJsBasedOnPackageJson({ outDir }) {
  let content = ''

  const dependencies: string[] = []
  const compositePackageJson = await readPackageJson(outDir)
  for (const dependency of Object.keys(compositePackageJson.dependencies)) {
    content += `import '${dependency}'\n`
    dependencies.push(dependency)
  }

  await fileUtils.writeFile(path.join(outDir, 'composite-imports.js'), content)
}

async function addStartScriptToPackageJson({ outDir }: { outDir: string }) {
  const packageJson = await readPackageJson(outDir)
  packageJson.scripts = {
    start: 'node node_modules/react-native/local-cli/cli.js start',
  }
  await writePackageJson(outDir, packageJson)
}

async function addBabelrcRoots({ outDir }: { outDir: string }) {
  const compositePackageJson = await readPackageJson(outDir)
  const compositeNodeModulesPath = path.join(outDir, 'node_modules')
  const compositeReactNativeVersion = await getCompositeReactNativeVersion({
    outDir,
  })
  const compositeMetroVersion = await getCompositeMetroVersion({ outDir })
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
    if (semver.lt(compositeMetroVersion, '0.51.0')) {
      // For versions of metro < 0.51.0, we are patching the reactNativeTransformer.js file
      // https://github.com/facebook/metro/blob/v0.50.0/packages/metro/src/reactNativeTransformer.js#L120
      pathToFileToPatch = path.join(
        compositeNodeModulesPath,
        'metro',
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
}

async function getCompositeReactNativeVersion({
  outDir,
}: {
  outDir: string
}): Promise<string> {
  const compositeNodeModulesPath = path.join(outDir, 'node_modules')
  const pathToReactNativeNodeModuleDir = path.join(
    compositeNodeModulesPath,
    'react-native'
  )

  const reactNativePackageJson = await readPackageJson(
    pathToReactNativeNodeModuleDir
  )
  return reactNativePackageJson.version
}

async function getCompositeMetroVersion({
  outDir,
}: {
  outDir: string
}): Promise<string> {
  const compositeNodeModulesPath = path.join(outDir, 'node_modules')
  const pathToMetroNodeModuleDir = path.join(compositeNodeModulesPath, 'metro')
  let metroPackageJson
  if (fs.existsSync(pathToMetroNodeModuleDir)) {
    metroPackageJson = await readPackageJson(pathToMetroNodeModuleDir)
  }
  return metroPackageJson ? metroPackageJson.version : '0.0.0'
}

async function patchMetro51({ outDir }: { outDir: string }) {
  const metroVersion = await getCompositeMetroVersion({ outDir })
  const compositeNodeModulesPath = path.join(outDir, 'node_modules')
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
    const patchedFile = fileToPatch.replace(stringToReplace, replacementString)
    return fileUtils.writeFile(pathToFileToPatch, patchedFile)
  }
}

async function createCompositeBabelRc({ outDir }: { outDir: string }) {
  log.debug('Creating top level composite .babelrc')
  const compositePackageJson = await readPackageJson(outDir)
  const compositeNodeModulesPath = path.join(outDir, 'node_modules')
  const compositeReactNativeVersion = await getCompositeReactNativeVersion({
    outDir,
  })

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
                        moduleResolverAliases[aliasKey] !== item.alias[aliasKey]
                      ) {
                        throw new Error('Babel module-resolver alias conflict')
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

  if (semver.gte(compositeReactNativeVersion, '0.57.0')) {
    compositeBabelRc.presets = ['module:metro-react-native-babel-preset']
  } else {
    compositeBabelRc.presets = ['react-native']
  }

  return fileUtils.writeFile(
    path.join(outDir, '.babelrc'),
    JSON.stringify(compositeBabelRc, null, 2)
  )
}

async function createRnCliConfig({ outDir }: { outDir: string }) {
  const compositeReactNativeVersion = await getCompositeReactNativeVersion({
    outDir,
  })
  let sourceExts
  if (semver.gte(compositeReactNativeVersion, '0.57.0')) {
    sourceExts =
      "module.exports = { resolver: { sourceExts: ['jsx', 'mjs', 'js', 'ts', 'tsx'] } };"
  } else {
    sourceExts =
      "module.exports = { getSourceExts: () => ['jsx', 'mjs', 'js', 'ts', 'tsx'] }"
  }
  await fileUtils.writeFile(path.join(outDir, 'rn-cli.config.js'), sourceExts)
}

async function patchPackageJsonForCodePush({ outDir }: { outDir: string }) {
  const compositePackageJson = await readPackageJson(outDir)
  const compositeNodeModulesPath = path.join(outDir, 'node_modules')
  const compositeReactNativeVersion = await getCompositeReactNativeVersion({
    outDir,
  })

  const pathToCodePushNodeModuleDir = path.join(
    compositeNodeModulesPath,
    'react-native-code-push'
  )

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
    await writePackageJson(outDir, compositePackageJson)
  }
}

async function installJsPackages({
  jsApiImplDependencies,
  miniApps,
  outDir,
  pathToYarnLock,
}: {
  jsApiImplDependencies?: PackagePath[]
  miniApps: PackagePath[]
  outDir: string
  pathToYarnLock?: string
}) {
  const jsPackages = jsApiImplDependencies
    ? [...miniApps, ...jsApiImplDependencies]
    : miniApps

  if (pathToYarnLock && _.some(jsPackages, p => p.isFilePath)) {
    log.warn(
      'Yarn lock will not be used as some of the MiniApp paths are file based'
    )
    pathToYarnLock = undefined
  }

  if (pathToYarnLock) {
    await installJsPackagesUsingYarnLock({
      jsPackages,
      outDir,
      pathToYarnLock,
    })
  } else {
    await installJsPackagesWithoutYarnLock({ jsPackages, outDir })
  }
}

async function installExtraJsDependencies({
  outDir,
  extraJsDependencies,
}: {
  outDir: string
  extraJsDependencies: PackagePath[]
}) {
  shell.pushd(outDir)
  try {
    for (const extraJsDependency of extraJsDependencies || []) {
      await yarn.add(extraJsDependency)
    }
  } finally {
    shell.popd()
  }
}
