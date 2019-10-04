import {
  gitCli,
  log,
  PackagePath,
  shell,
  yarn,
  readPackageJson,
  writePackageJson,
  fileUtils,
  kax,
  YarnLockParser,
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
import uuidv4 from 'uuid/v4'

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
        resolutions: config.resolutions,
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
    resolutions,
  }: {
    extraJsDependencies?: PackagePath[]
    jsApiImplDependencies?: PackagePath[]
    pathToYarnLock?: string
    resolutions?: { [pkg: string]: string }
  } = {}
) {
  if (fs.existsSync(outDir)) {
    await kax
      .task('Cleaning up existing composite directory')
      .run(cleanupCompositeDir(outDir))
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
      await installExtraJsDependencies({
        extraJsDependencies: [
          PackagePath.fromString('ern-bundle-store-metro-asset-plugin'),
          ...extraJsDependencies,
        ],
        outDir,
      })
    }
    await addBabelrcRoots({ outDir })
    await createCompositeBabelRc({ outDir })
    await createMetroConfigJs({ outDir })
    await createRnCliConfig({ outDir })
    if (resolutions) {
      await applyYarnResolutions({ outDir, resolutions })
    }
    const rnVersion = await getCompositeReactNativeVersion({ outDir })
    await addReactNativeDependencyToPackageJson(outDir, rnVersion)
    if (semver.lt(rnVersion, '0.60.0')) {
      await patchMetro51({ outDir })
    }
    await patchMetroBabelEnv({ outDir })
  } finally {
    shell.popd()
  }
}

async function addReactNativeDependencyToPackageJson(
  dir: string,
  version: string
) {
  const compositePackageJson = await readPackageJson(dir)
  compositePackageJson.dependencies['react-native'] = version
  await writePackageJson(dir, compositePackageJson)
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
  await kax.task('Running yarn install').run(yarn.install())
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
  const nbJsPackages = jsPackages.length
  for (let i = 0; i < nbJsPackages; i++) {
    await kax
      .task(`[${i + 1}/${nbJsPackages}] Adding ${jsPackages[i]}`)
      .run(yarn.add(jsPackages[i]))
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

  await fileUtils.writeFile(path.join(outDir, 'index.js'), entryIndexJsContent)
  // Still also generate index.android.js and index.ios.js for backward compatibility with
  // Container generated with Electrode Native < 0.33.0, as these Containers are still
  // looking for these files.
  // TO BE REMOVED IN 0.40.0
  await fileUtils.writeFile(
    path.join(outDir, 'index.ios.js'),
    entryIndexJsContent
  )
  await fileUtils.writeFile(
    path.join(outDir, 'index.android.js'),
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
  const babelRcRootsRe: RegExp[] = []
  const babelRcRootsPaths: string[] = []
  for (const dependency of dependencies) {
    if (fs.existsSync(path.join(compositeNodeModulesPath, dependency))) {
      const depPackageJson = await readPackageJson(
        path.join(compositeNodeModulesPath, dependency)
      )
      if (depPackageJson.ern && depPackageJson.ern.useBabelRc === true) {
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

    const patch = `extraConfig.babelrcRoots = [
${babelRcRootsRe.map(b => b.toString()).join(',')} ]
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
  // Only of use for RN < 0.60.0
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

//
// Patch a metro bug related to BABEL_ENV resolution
// This bug was fixed in metro through:
// https://github.com/facebook/metro/commit/c509a89af9015b6d6b34c07a26ea59b73d87cd53
// It has not been released yet and will anyway not be available for older
// versions of React Native.
// Patching is therefore done here, independently of the version of RN used.
// We can keep this patch potentially forever as the replacement it is doing can
// also be safely applied in any case, even on top of a metro release that contain the fix.
async function patchMetroBabelEnv({ outDir }: { outDir: string }) {
  const filesToPach = [
    path.join(
      outDir,
      'node_modules/metro-react-native-babel-transformer/src/index.js'
    ),
    path.join(outDir, 'node_modules/metro-babel-transformer/src/index.js'),
  ]
  const stringToReplace = 'process.env.BABEL_ENV = OLD_BABEL_ENV;'
  const replacementString =
    'if (OLD_BABEL_ENV) { process.env.BABEL_ENV = OLD_BABEL_ENV; }'
  for (const fileToPatch of filesToPach) {
    if (fs.existsSync(fileToPatch)) {
      const file = await fileUtils.readFile(fileToPatch)
      const patchedFile = file.replace(stringToReplace, replacementString)
      await fileUtils.writeFile(fileToPatch, patchedFile)
    }
  }
}

export async function applyYarnResolutions({
  outDir,
  resolutions,
}: {
  outDir: string
  resolutions: { [pkg: string]: string }
}) {
  log.debug('Adding yarn resolutions to package.json')
  log.trace(`resolutions : ${JSON.stringify(resolutions, null, 2)}`)
  const compositePackageJson = await readPackageJson(outDir)
  compositePackageJson.resolutions = resolutions
  await writePackageJson(outDir, compositePackageJson)
  try {
    shell.pushd(outDir)
    await yarn.install()
  } finally {
    shell.popd()
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
              // Add unique name to this composite top level module-resolver to avoid
              // it messing with other module-resolver plugin configurations that could
              // be defined in the .babelrc config of individual MiniApps
              // https://babeljs.io/docs/en/options#plugin-preset-merging
              babelPlugin.push(uuidv4())
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

async function createMetroConfigJs({ outDir }: { outDir: string }) {
  return fileUtils.writeFile(
    path.join(outDir, 'metro.config.js'),
    `const blacklist = require('metro-config/src/defaults/blacklist');
module.exports = {
  resolver: {
    blacklistRE: blacklist([
      // Ignore IntelliJ directories
      /.*\\.idea\\/.*/,
      // ignore git directories
      /.*\\.git\\/.*/,
      // Ignore android directories
      /.*\\/app\\/build\\/.*/
    ])
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: false,
      },
    }),
    assetPlugins: ['ern-bundle-store-metro-asset-plugin'],
  },
};
`
  )
}

async function createRnCliConfig({ outDir }: { outDir: string }) {
  const compositeReactNativeVersion = await getCompositeReactNativeVersion({
    outDir,
  })
  let sourceExts
  if (semver.gte(compositeReactNativeVersion, '0.57.0')) {
    sourceExts =
      "module.exports = { resolver: { sourceExts: ['jsx', 'js', 'ts', 'tsx', 'mjs'] } };"
  } else {
    sourceExts =
      "module.exports = { getSourceExts: () => ['jsx', 'js', 'ts', 'tsx', 'mjs'] }"
  }
  await fileUtils.writeFile(path.join(outDir, 'rn-cli.config.js'), sourceExts)
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
