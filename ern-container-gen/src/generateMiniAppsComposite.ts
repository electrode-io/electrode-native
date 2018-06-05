import { log, PackagePath, shell, yarn } from 'ern-core'
import { cleanupMiniAppsCompositeDir } from './cleanupMiniAppsCompositeDir'
import {
  MiniAppsDeltas,
  getMiniAppsDeltas,
  getPackageJsonDependenciesUsingMiniAppDeltas,
  runYarnUsingMiniAppDeltas,
} from './miniAppsDeltasUtils'
import { runAfterJsCompositeGenerationScript } from './runAfterJsCompositeGenerationScript'
import { writeFile } from './writeFile'
import fs from 'fs'
import path from 'path'
import _ from 'lodash'

// Obviously too big -god- function
// Prime candidate for refactoring
export async function generateMiniAppsComposite(
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
    cleanupMiniAppsCompositeDir(outDir)
  } else {
    shell.mkdir('-p', outDir)
  }

  shell.cd(outDir)

  let compositePackageJson: any = {}

  if (pathToYarnLock && _.some(miniappsPaths, p => p.isFilePath)) {
    log.warn(
      'Yarn lock will not be used as some of the MiniApp paths are file based'
    )
    pathToYarnLock = undefined
  }

  if (pathToYarnLock) {
    if (_.some(miniappsPaths, m => !m.version)) {
      throw new Error(
        '[generateMiniAppsComposite] When providing a yarn lock you cannot pass MiniApps without an explicit version'
      )
    }

    if (!fs.existsSync(pathToYarnLock)) {
      throw new Error(
        `[generateMiniAppsComposite] Path to yarn.lock does not exist (${pathToYarnLock})`
      )
    }

    log.debug(`Copying yarn.lock to ${outDir}`)
    shell.cp(pathToYarnLock, path.join(outDir, 'yarn.lock'))

    const yarnLock = fs.readFileSync(pathToYarnLock, 'utf8')
    const miniAppsDeltas: MiniAppsDeltas = getMiniAppsDeltas(
      miniappsPaths,
      yarnLock
    )

    log.debug(
      `[generateMiniAppsComposite] miniAppsDeltas: ${JSON.stringify(
        miniAppsDeltas
      )}`
    )

    compositePackageJson.dependencies = getPackageJsonDependenciesUsingMiniAppDeltas(
      miniAppsDeltas,
      yarnLock
    )
    compositePackageJson.scripts = {
      start: 'node node_modules/react-native/local-cli/cli.js start',
    }

    log.debug(JSON.stringify(compositePackageJson.dependencies, null, 2))

    fs.writeFileSync(
      path.join(outDir, 'package.json'),
      JSON.stringify(compositePackageJson, null, 2),
      'utf8'
    )

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
    packageJson.scripts = {
      start: 'node node_modules/react-native/local-cli/cli.js start',
    }
    fs.writeFileSync(
      packageJsonPath,
      JSON.stringify(packageJson, null, 2),
      'utf8'
    )
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
    for (const apiImpl of jsApiImplDependencies!) {
      await yarn.add(apiImpl)
      entryIndexJsContent += `import '${apiImpl.basePath}'\n`
    }
  }

  await runAfterJsCompositeGenerationScript(outDir)

  log.debug('Removing .babelrc files from all modules')
  shell.rm('-rf', path.join('node_modules', '**', '.babelrc'))

  log.debug('Creating top level composite .babelrc')
  const compositeBabelRc: { plugins: string[]; presets: string[] } = {
    plugins: [],
    presets: ['react-native'],
  }

  // Ugly hacky way of handling module-resolver babel plugin
  // At least it has some guarantees to make it safer but its just a temporary
  // solution until we figure out a more proper way of handling this plugin
  log.debug('Taking care of potential Babel plugins used by MiniApps')
  let moduleResolverAliases = {}
  for (const dependency of Object.keys(compositePackageJson.dependencies)) {
    const miniAppPackageJsonPath = path.join(
      outDir,
      'node_modules',
      dependency,
      'package.json'
    )
    let miniAppPackageJson
    try {
      miniAppPackageJson = JSON.parse(
        fs.readFileSync(miniAppPackageJsonPath, 'utf-8')
      )
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
                let item: any
                for (item in babelPlugin) {
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
      fs.writeFileSync(
        miniAppPackageJsonPath,
        JSON.stringify(miniAppPackageJson, null, 2),
        'utf-8'
      )
    }
  }

  await writeFile('.babelrc', JSON.stringify(compositeBabelRc, null, 2))

  const pathToCodePushNodeModuleDir = path.join(
    outDir,
    'node_modules',
    'react-native-code-push'
  )
  const pathToReactNativeNodeModuleDir = path.join(
    outDir,
    'node_modules',
    'react-native'
  )
  const pathToReactNativePackageJson = path.join(
    pathToReactNativeNodeModuleDir,
    'package.json'
  )
  // If code push plugin is present we need to do some additional work
  if (fs.existsSync(pathToCodePushNodeModuleDir)) {
    const reactNativePackageJson = JSON.parse(
      fs.readFileSync(pathToReactNativePackageJson, 'utf8')
    )

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
    compositePackageJson.dependencies['react-native'] =
      reactNativePackageJson.version
    compositePackageJson.name = 'container'
    compositePackageJson.version = '0.0.1'
    fs.writeFileSync(
      'package.json',
      JSON.stringify(compositePackageJson, null, 2)
    )
  }

  log.debug('Creating index.android.js')
  await writeFile('index.android.js', entryIndexJsContent)
  log.debug('Creating index.ios.js')
  await writeFile('index.ios.js', entryIndexJsContent)
}
