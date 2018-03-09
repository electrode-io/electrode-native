// @flow

import fs from 'fs'
import _ from 'lodash'
import path from 'path'
import semver from 'semver'
import {
  reactnative,
  yarn,
  MiniApp,
  PackagePath,
  shell,
  manifest,
  handleCopyDirective,
  ModuleTypes,
  utils
} from 'ern-core'

export async function bundleMiniApps (
  // The miniapps to be bundled
  miniapps: Array<MiniApp>,
  compositeMiniAppDir: string,
  outDir: string,
  platform: 'android' | 'ios', {
    pathToYarnLock
  } : {
    pathToYarnLock?: string
  } = {},
  // JavaScript API implementations
  jsApiImplDependencies?: Array<PackagePath>) {
  try {
    log.debug('[=== Starting mini apps bundling ===]')

    let miniAppsPaths : Array<PackagePath> = []
    for (const miniapp of miniapps) {
      miniAppsPaths.push(miniapp.packagePath)
    }

    await generateMiniAppsComposite(miniAppsPaths, compositeMiniAppDir, {pathToYarnLock}, jsApiImplDependencies)

    clearReactPackagerCache()

    if (platform === 'android') {
      log.debug('Bundling miniapp(s) for Android')
      await reactNativeBundleAndroid(outDir)
    } else if (platform === 'ios') {
      log.debug('Bundling miniapp(s) for iOS')
      await reactNativeBundleIos(outDir)
    }

    log.debug('[=== Completed mini apps bundling ===]')
  } catch (e) {
    log.error(`[bundleMiniApps] Something went wrong: ${e}`)
    throw e
  }
}

export async function reactNativeBundleAndroid (outDir: string) {
  const libSrcMainPath = path.join(outDir, 'lib', 'src', 'main')
  const bundleOutput = path.join(libSrcMainPath, 'assets', 'index.android.bundle')
  const assetsDest = path.join(libSrcMainPath, 'res')

  return reactnative.bundle({
    entryFile: 'index.android.js',
    dev: false,
    bundleOutput,
    platform: 'android',
    assetsDest
  })
}

export async function reactNativeBundleIos (outDir: string) {
  const miniAppOutPath = path.join(outDir, 'ElectrodeContainer', 'Libraries', 'MiniApp')
  const bundleOutput = path.join(miniAppOutPath, 'MiniApp.jsbundle')
  const assetsDest = miniAppOutPath

  if (!fs.existsSync(miniAppOutPath)) {
    shell.mkdir('-p', miniAppOutPath)
  }

  return reactnative.bundle({
    entryFile: 'index.ios.js',
    dev: false,
    bundleOutput,
    platform: 'ios',
    assetsDest
  })
}

export async function generateMiniAppsComposite (
  miniappsPaths: Array<PackagePath>,
  outDir: string, {
    pathToYarnLock,
    extraJsDependencies = []
  } : {
    pathToYarnLock?: string,
    extraJsDependencies?: Array<PackagePath>
  } = {},
  jsApiImplDependencies?: Array<PackagePath>) {
  shell.mkdir('-p', outDir)
  shell.cd(outDir)

  let compositePackageJson = {}

  if (pathToYarnLock && (_.some(miniappsPaths, p => p.isFilePath || p.isGitPath))) {
    log.warn('Yarn lock will not be used as some of the MiniApp paths are file or git based')
    pathToYarnLock = undefined
  }

  if (pathToYarnLock) {
    if (_.some(miniappsPaths, m => !m.version)) {
      throw new Error('[generateMiniAppsComposite] When providing a yarn lock you cannot pass MiniApps without an explicit version')
    }

    if (!fs.existsSync(pathToYarnLock)) {
      throw new Error(`[generateMiniAppsComposite] Path to yarn.lock does not exist (${pathToYarnLock})`)
    }

    log.debug(`Copying yarn.lock to ${outDir}`)
    shell.cp(pathToYarnLock, outDir)

    const yarnLock = fs.readFileSync(pathToYarnLock, 'utf8')
    const miniAppsDeltas = getMiniAppsDeltas(miniappsPaths, yarnLock)

    log.debug(`[generateMiniAppsComposite] miniAppsDeltas: ${JSON.stringify(miniAppsDeltas)}`)

    compositePackageJson.dependencies = getPackageJsonDependenciesUsingMiniAppDeltas(miniAppsDeltas, yarnLock)
    compositePackageJson.scripts = {'start': 'node node_modules/react-native/local-cli/cli.js start'}

    fs.writeFileSync(path.join(outDir, 'package.json'), JSON.stringify(compositePackageJson, null, 2), 'utf8')

    // Now that the composite package.json is similar to the one used to generated yarn.lock
    // we can run yarn install to get back to the exact same dependency graph as the previously
    // generated composite
    await yarn.install()
    await runYarnUsingMiniAppDeltas(miniAppsDeltas)
  } else {
    // No yarn.lock path was provided, just add miniapps one by one
    log.debug('[generateMiniAppsComposite] no yarn lock provided')
    await yarn.init()
    for (const miniappPath of miniappsPaths) {
      await yarn.add(miniappPath)
    }

    const packageJsonPath = path.join(outDir, 'package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
    packageJson.scripts = {'start': 'node node_modules/react-native/local-cli/cli.js start'}
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8')
  }

  for (const extraJsDependency of extraJsDependencies) {
    await yarn.add(extraJsDependency)
  }

  let entryIndexJsContent = ''

  compositePackageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  for (const dependency of Object.keys(compositePackageJson.dependencies)) {
    entryIndexJsContent += `import '${dependency}'\n`
  }

  if (jsApiImplDependencies) {
    log.debug('Adding imports for JS API implementations.')
    for (const apiImpl of jsApiImplDependencies) {
      await yarn.add(apiImpl)
      entryIndexJsContent += `import '${apiImpl.basePath}'\n`
    }
  }
  log.debug('Removing .babelrc files from all modules')
  shell.rm('-rf', path.join('node_modules', '**', '.babelrc'))

  log.debug('Creating top level composite .babelrc')
  const compositeBabelRc = { 'presets': ['react-native'], 'plugins': [] }

  // Ugly hacky way of handling module-resolver babel plugin
  // At least it has some guarantees to make it safer but its just a temporary
  // solution until we figure out a more proper way of handling this plugin
  log.debug('Taking care of potential Babel plugins used by MiniApps')
  let moduleResolverAliases = {}
  for (const dependency of Object.keys(compositePackageJson.dependencies)) {
    const miniAppPackageJsonPath = path.join(outDir, 'node_modules', dependency, 'package.json')
    let miniAppPackageJson
    try {
      miniAppPackageJson = JSON.parse(fs.readFileSync(miniAppPackageJsonPath, 'utf-8'))
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
              log.debug(`Taking care of module-resolver Babel plugin for ${miniAppName} MiniApp`)
              if (compositeBabelRc.plugins.length === 0) {
                // First MiniApp to add module-resolver plugin & config
                // easy enough, we just copy over the plugin & config
                compositeBabelRc.plugins.push(babelPlugin)
                for (const x of babelPlugin) {
                  if ((x instanceof Object) && (x.alias)) {
                    moduleResolverAliases = x.alias
                    break
                  }
                }
              } else {
                // Another MiniApp  has already declared module-resolver
                // plugin & config. If we have conflicts for aliases, we'll just abort
                // bundling as of now to avoid generating a potentially unstable bundle
                for (const item in babelPlugin) {
                  if ((item instanceof Object) && (item.alias)) {
                    for (const aliasKey of Object.keys(item.alias)) {
                      if (moduleResolverAliases[aliasKey] && moduleResolverAliases[aliasKey] !== item.alias[aliasKey]) {
                        throw new Error('Babel module-resolver alias conflict')
                      } else if (!moduleResolverAliases[aliasKey]) {
                        moduleResolverAliases[aliasKey] = item.alias[aliasKey]
                      }
                    }
                  }
                }
              }
            } else {
              log.warn(`Unsupported Babel plugin type ${babelPlugin.toString()} in ${miniAppName} MiniApp`)
            }
          } else {
            log.warn(`Unsupported Babel plugin type ${babelPlugin.toString()} in ${miniAppName} MiniApp`)
          }
        }
      }
      log.debug(`Removing babel object from ${miniAppName} MiniApp package.json`)
      delete miniAppPackageJson['babel']
      fs.writeFileSync(miniAppPackageJsonPath, JSON.stringify(miniAppPackageJson, null, 2), 'utf-8')
    }
  }

  await writeFile('.babelrc', JSON.stringify(compositeBabelRc, null, 2))

  const pathToCodePushNodeModuleDir = path.join(outDir, 'node_modules', 'react-native-code-push')
  const pathToReactNativeNodeModuleDir = path.join(outDir, 'node_modules', 'react-native')
  const pathToReactNativePackageJson = path.join(pathToReactNativeNodeModuleDir, 'package.json')
  // If code push plugin is present we need to do some additional work
  if (fs.existsSync(pathToCodePushNodeModuleDir)) {
    const reactNativePackageJson = JSON.parse(fs.readFileSync(pathToReactNativePackageJson, 'utf8'))

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
    compositePackageJson.dependencies['react-native'] = reactNativePackageJson.version
    compositePackageJson.name = 'container'
    compositePackageJson.version = '0.0.1'
    fs.writeFileSync('package.json', JSON.stringify(compositePackageJson, null, 2))
  }

  log.debug('Creating index.android.js')
  await writeFile('index.android.js', entryIndexJsContent)
  log.debug('Creating index.ios.js')
  await writeFile('index.ios.js', entryIndexJsContent)
}

// TODO : [WINDOWS SUPPORT]
export function clearReactPackagerCache () {
  const TMPDIR = process.env['TMPDIR']
  if (TMPDIR) {
    shell.rm('-rf', `${TMPDIR}/react-*`)
  }
}

// Using a yarn.lock file content as reference to figure out deltas, group the MiniApps as follow :
// 'new' : The MiniApp is a new one (it was not part of previously generated composite)
// 'same' : The MiniApp is the same (it was part of previously generated composite, with same version)
// 'upgraded' : The MiniApp has a new version (it was part of previously generated composite, but with a different version)
export function getMiniAppsDeltas (
  miniApps: Array<PackagePath>,
  yarnlock: string) {
  return _.groupBy(miniApps, (m: PackagePath) => {
    const re = new RegExp(`\n${m.basePath}@(.+):`)
    const match = re.exec(yarnlock)
    if (match === null) {
      return 'new'
    } else {
      return (match[1] === m.version) ? 'same' : 'upgraded'
    }
  })
}

// Generate package.json dependencies object based on MiniApp deltas
// The  object will contain the same MiniApps at the same versions that were
// used to generate the provided yarn.lock, so that we get back to original state
// conforming with yarn.lock
// It only contains 'same' and 'upgrade' MiniApps (not new ones)
export function getPackageJsonDependenciesUsingMiniAppDeltas (
  miniAppsDeltas: Object,
  yarnlock: string) {
  let result = {}

  if (miniAppsDeltas.same) {
    for (const m of miniAppsDeltas.same) {
      result[`${m.basePath}`] = m.version
    }
  }

  if (miniAppsDeltas.upgraded) {
    for (const m of miniAppsDeltas.upgraded) {
      const re = new RegExp(`\n${m.basePath}@(.+):`)
      const initialVersion = re.exec(yarnlock)[1]
      result[`${m.basePath}`] = initialVersion
    }
  }

  return result
}

export async function runYarnUsingMiniAppDeltas (miniAppsDeltas: Object) {
  // Now we can `yarn add` new MiniApps and `yarn upgrade` the ones that have new versions
  if (miniAppsDeltas.new) {
    for (const m of miniAppsDeltas.new) {
      log.debug(`Adding new MiniApp ${m.toString()}`)
      await yarn.add(m)
    }
  }

  if (miniAppsDeltas.upgraded) {
    for (const m of miniAppsDeltas.upgraded) {
      log.debug(`Upgrading MiniApp ${m.toString()}`)
      await yarn.upgrade(m)
    }
  }
}

export async function generatePluginsMustacheViews (
  plugins: Array<PackagePath>,
  platform: string) {
  let pluginsViews = []
  log.debug('Generating plugins mustache views')
  for (const plugin of plugins) {
    if (plugin.name === 'react-native') {
      continue
    }
    let pluginConfig = await manifest.getPluginConfig(plugin)
    if (!pluginConfig[platform]) {
      log.warn(`${plugin.basePath} does not have any injection configuration for ${platform} platform`)
      continue
    }
    const pluginHook = pluginConfig[platform].pluginHook
    const containerHeader = pluginConfig[platform].containerPublicHeader

    if (!pluginHook && !containerHeader) {
      continue
    }

    let pluginView = {}
    if (pluginHook) {
      pluginView.name = pluginHook.name
      pluginView.lcname = pluginHook.name && pluginHook.name.charAt(0).toLowerCase() + pluginHook.name.slice(1)
      pluginView.configurable = pluginHook.configurable
    }

    pluginView.customRepos = []
    if (pluginConfig.android && pluginConfig.android.repositories) {
      pluginView.customRepos.push(...pluginConfig.android.repositories)
    }

    pluginView.customPermissions = []
    if (pluginConfig.android && pluginConfig.android.permissions) {
      pluginView.customPermissions.push(...pluginConfig.android.permissions)
    }

    if (containerHeader) {
      pluginView.containerHeader = containerHeader
    }

    pluginsViews.push(pluginView)
  }
  return pluginsViews
}

export function copyRnpmAssets (
  miniApps: Array<MiniApp>,
  compositeMiniAppDir: string,
  outDir: string,
  platform: 'android' | 'ios') {
  // Case of local container for runner
  if ((miniApps.length === 1) && (miniApps[0].path)) {
    platform === 'android'
      ? copyAndroidRnpmAssetsFromMiniAppPath(miniApps[0].path, outDir)
      : copyIosRnpmAssetsFromMiniAppPath(miniApps[0].path, outDir)
  } else {
    for (const miniApp of miniApps) {
      const miniAppPath = path.join(
        compositeMiniAppDir,
        'node_modules',
        miniApp.packageJson.name)
      platform === 'android'
        ? copyAndroidRnpmAssetsFromMiniAppPath(miniAppPath, outDir)
        : copyIosRnpmAssetsFromMiniAppPath(miniAppPath, outDir)
    }
  }
}

function copyAndroidRnpmAssetsFromMiniAppPath (miniAppPath: string, outputPath: string) {
  const packageJson = JSON.parse(fs.readFileSync(path.join(miniAppPath, 'package.json'), 'utf-8'))
  if (packageJson.rnpm && packageJson.rnpm.assets) {
    for (const assetDirectoryName of packageJson.rnpm.assets) {
      const source = path.join(assetDirectoryName, '*')
      const dest = path.join('lib', 'src', 'main', 'assets', assetDirectoryName.toLowerCase())
      handleCopyDirective(miniAppPath, outputPath, [{ source, dest }])
    }
  }
}

function copyIosRnpmAssetsFromMiniAppPath (miniAppPath: string, outputPath: string) {
  const packageJson = JSON.parse(fs.readFileSync(path.join(miniAppPath, 'package.json'), 'utf-8'))
  if (packageJson.rnpm && packageJson.rnpm.assets) {
    for (const assetDirectoryName of packageJson.rnpm.assets) {
      const source = path.join(assetDirectoryName, '*')
      const dest = path.join('ElectrodeContainer', 'Resources')
      handleCopyDirective(miniAppPath, outputPath, [{ source, dest }])
    }
  }
}

export function injectReactNativeVersionKeysInObject (
  object: Object,
  reactNativeVersion: string) {
  return Object.assign(object, {
    reactNativeVersion,
    RN_VERSION_GTE_54: semver.gte(reactNativeVersion, '0.54.0'),
    RN_VERSION_LT_54: semver.lt(reactNativeVersion, '0.54.0')
  })
}

export function sortDependenciesByName (dependencies: Array<PackagePath>) {
  return dependencies.sort((a, b) => {
    if (a.basePath < b.basePath) {
      return -1
    }
    if (a.basePath > b.basePath) {
      return 1
    }
    return 0
  })
}

/**
 *
 * @param apiImplPluginPath : node package directory from for the api impl module.
 * @param mustacheView: Object
 * @param excludeJsImpl: setting this to true will exclude api details for a JS implementation.
 * @param excludeNativeImpl: setting this to true will exclude api details for a native implementation.
 */
export function populateApiImplMustacheView (apiImplPluginPath: string, mustacheView?: Object = {}, excludeJsImpl?: boolean, excludeNativeImpl?: boolean) {
  const packageJson = JSON.parse(fs.readFileSync(path.join(apiImplPluginPath, 'package.json'), 'utf-8'))
  const containerGenConfig = packageJson.ern.containerGen
  if (containerGenConfig && containerGenConfig.apiNames) {
    mustacheView.apiImplementations = mustacheView.apiImplementations ? mustacheView.apiImplementations : []
    for (const apiName of containerGenConfig.apiNames) {
      if (excludeJsImpl && packageJson.ern.moduleType === ModuleTypes.JS_API_IMPL) {
        continue
      }
      if (excludeNativeImpl && packageJson.ern.moduleType === ModuleTypes.NATIVE_API_IMPL) {
        continue
      }
      let api = {
        apiName,
        hasConfig: containerGenConfig.hasConfig,
        apiVariableName: utils.camelize(apiName, true)
      }
      mustacheView.apiImplementations.push(api)
    }
  } else {
    log.warn(`!!!!! containerGen entry not valid for api implementation, skipping api-impl code gen in container for ${packageJson.name} !!!!`)
  }
}

// =============================================================================
// Async wrappers
// =============================================================================

async function writeFile (
  filename: string,
  data: any) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filename, data, (err, res) => {
      if (err) reject(err)
      else resolve(res)
    })
  })
}
