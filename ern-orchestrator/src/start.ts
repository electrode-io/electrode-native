import {
  createTmpDir,
  android,
  ios,
  config as ernConfig,
  PackagePath,
  shell,
  reactnative,
  ErnBinaryStore,
  log,
  kax,
  readPackageJsonSync,
  AppVersionDescriptor,
} from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import { generateComposite } from 'ern-composite-gen'
import _ from 'lodash'
import chokidar from 'chokidar'
import path from 'path'
import fs from 'fs'

export default async function start({
  baseComposite,
  compositeDir,
  jsApiImpls,
  miniapps,
  descriptor,
  flavor,
  watchNodeModules = [],
  packageName,
  activityName,
  bundleId,
  extraJsDependencies,
  disableBinaryStore,
  host,
  port,
}: {
  baseComposite?: PackagePath
  compositeDir?: string
  jsApiImpls?: PackagePath[]
  miniapps?: PackagePath[]
  descriptor?: AppVersionDescriptor
  flavor?: string
  watchNodeModules?: string[]
  packageName?: string
  activityName?: string
  bundleId?: string
  extraJsDependencies?: PackagePath[]
  disableBinaryStore?: boolean
  host?: string
  port?: string
} = {}) {
  const cauldron = await getActiveCauldron({ throwIfNoActiveCauldron: false })
  if (!cauldron && descriptor) {
    throw new Error(
      'To use a native application descriptor, a Cauldron must be active'
    )
  }

  if (!miniapps && !jsApiImpls && !descriptor) {
    throw new Error(
      'Either miniapps, jsApiImpls or descriptor needs to be provided'
    )
  }

  let resolutions
  if (descriptor) {
    miniapps = await cauldron.getContainerMiniApps(descriptor, {
      favorGitBranches: true,
    })
    const compositeGenConfig = await cauldron.getCompositeGeneratorConfig(
      descriptor
    )
    baseComposite =
      baseComposite || (compositeGenConfig && compositeGenConfig.baseComposite)
    resolutions = compositeGenConfig && compositeGenConfig.resolutions
  }

  // Because this command can only be stoped through `CTRL+C` (or killing the process)
  // we listen for the SIGINT signal and then just exit the process
  // This is needed for tmp module to do its cleanup, otherwise the temporary directory
  // is not removed after `CTRL+C` is done
  process.on('SIGINT', () => process.exit())

  compositeDir = compositeDir || createTmpDir()
  log.trace(`Temporary composite directory is ${compositeDir}`)

  await kax.task('Generating MiniApps composite').run(
    generateComposite({
      baseComposite,
      extraJsDependencies: extraJsDependencies || undefined,
      jsApiImplDependencies: jsApiImpls,
      miniApps: miniapps!,
      outDir: compositeDir,
      resolutions,
    })
  )

  const miniAppsLinksObj = ernConfig.getValue('miniAppsLinks', {})
  const linkedMiniAppsPackageNames = Object.keys(miniAppsLinksObj).filter(p =>
    fs.existsSync(miniAppsLinksObj[p])
  )

  // Auto link file based miniapps
  miniapps!
    .filter(m => m.isFilePath)
    .forEach(m => {
      const packageJson = readPackageJsonSync(m.basePath)
      linkedMiniAppsPackageNames.push(packageJson.name)
      miniAppsLinksObj[packageJson.name] = m.basePath
    })

  linkedMiniAppsPackageNames.forEach(pkgName => {
    replacePackageInCompositeWithLinkedPackage(
      compositeDir,
      pkgName,
      miniAppsLinksObj[pkgName]
    )
  })

  reactnative.startPackagerInNewWindow({
    cwd: compositeDir,
    host,
    port,
    provideModuleNodeModules: [
      'react-native',
      ...linkedMiniAppsPackageNames,
      ...watchNodeModules,
    ],
    resetCache: true,
  })

  if (descriptor && !disableBinaryStore) {
    const binaryStoreConfig = await cauldron.getBinaryStoreConfig()
    if (binaryStoreConfig) {
      const cauldronStartCommandConfig = await cauldron.getStartCommandConfig(
        descriptor
      )
      const binaryStore = new ErnBinaryStore(binaryStoreConfig)
      if (await binaryStore.hasBinary(descriptor, { flavor })) {
        if (descriptor.platform === 'android') {
          if (
            cauldronStartCommandConfig &&
            cauldronStartCommandConfig.android
          ) {
            packageName =
              packageName || cauldronStartCommandConfig.android.packageName
            activityName =
              activityName || cauldronStartCommandConfig.android.activityName
          }
          if (!packageName) {
            throw new Error(
              'You need to provide an Android package name or set it in Cauldron configuration'
            )
          }
          const apkPath = await kax
            .task('Downloading binary from store')
            .run(binaryStore.getBinary(descriptor, { flavor }))
          await android.runAndroidApk({ apkPath, packageName, activityName })
        } else if (descriptor.platform === 'ios') {
          if (cauldronStartCommandConfig && cauldronStartCommandConfig.ios) {
            bundleId = bundleId || cauldronStartCommandConfig.ios.bundleId
          }
          if (!bundleId) {
            throw new Error(
              'You need to provide an iOS bundle ID or set it in Cauldron configuration'
            )
          }
          const appPath = await kax
            .task('Downloading binary from store')
            .run(binaryStore.getBinary(descriptor, { flavor }))
          await ios.runIosApp({ appPath, bundleId })
        }
      }
    }
  }

  linkedMiniAppsPackageNames.forEach(pkgName => {
    log.info(
      `Watching for changes in linked MiniApp directory ${
        miniAppsLinksObj[pkgName]
      }`
    )
    startLinkSynchronization(compositeDir, pkgName, miniAppsLinksObj[pkgName])
  })

  log.warn('=========================================================')
  log.warn('Ending this process will stop monitoring linked MiniApps.')
  log.warn('You can end this process once you are done, using CTRL+C.')
  log.warn('=========================================================')

  // Trick to keep the Node process alive even if no MiniApps are linked (otherwise linked
  // MiniApps will keep process alive as they are registering event listeners)
  // We need to keep the process alive due to the fact that we create the composite
  // project in a temporary directory which gets destroyed upon process exit.
  // If the process exits too soon, then the packager (running in a separate process)
  // fails as the directory containing the files to package, does not exist anymore.
  if (linkedMiniAppsPackageNames.length === 0) {
    process.stdin.resume()
  }
}

function replacePackageInCompositeWithLinkedPackage(
  compositeDir,
  linkedPackageName,
  sourceLinkDir
) {
  const pathToPackageInComposite = getPathToPackageInComposite(
    compositeDir,
    linkedPackageName
  )
  shell.rm('-Rf', pathToPackageInComposite)
  shell.mkdir('-p', pathToPackageInComposite)
  shell.cp('-Rf', path.join(sourceLinkDir, '{.*,*}'), pathToPackageInComposite)
  // We remove react-native and react to avoid haste collisions, as they are
  // already part of the top level composite node_modules
  // We also remove react-native-electrode-bridge because having multiple instances
  // of it will create issues. We want to use top level instance.
  const pathToPackageNodeModules = path.join(
    pathToPackageInComposite,
    'node_modules'
  )
  shell.rm('-Rf', [
    path.join(pathToPackageNodeModules, 'react-native'),
    path.join(pathToPackageNodeModules, 'react'),
    path.join(pathToPackageNodeModules, 'react-native-electrode-bridge'),
  ])
}

function startLinkSynchronization(
  compositeDir,
  linkedPackageName,
  sourceLinkDir
) {
  log.trace(
    `startLinkSynchronization [${compositeDir}] [${linkedPackageName}] [${sourceLinkDir}]`
  )

  const watcher = chokidar.watch(sourceLinkDir, {
    cwd: sourceLinkDir,
    ignoreInitial: true,
    ignored: ['android/**', 'ios/**'],
    persistent: true,
  })

  const rootTargetLinkDir = getPathToPackageInComposite(
    compositeDir,
    linkedPackageName
  )

  watcher
    .on('add', p => {
      const sourcePath = path.join(sourceLinkDir, p)
      const targetPath = path.join(rootTargetLinkDir, p)
      log.debug(`Copying ${sourcePath} to ${targetPath}`)
      shell.cp(sourcePath, targetPath)
    })
    .on('change', p => {
      const sourcePath = path.join(sourceLinkDir, p)
      const targetPath = path.join(rootTargetLinkDir, p)
      log.debug(`Copying ${sourcePath} to ${targetPath}`)
      shell.cp(sourcePath, targetPath)
    })
    .on('unlink', p => {
      const targetPath = path.join(rootTargetLinkDir, p)
      log.debug(`Removing ${targetPath}`)
      shell.rm(targetPath)
    })
    .on('addDir', p => {
      const targetPath = path.join(rootTargetLinkDir, p)
      log.debug(`Creating directory ${targetPath}`)
      shell.mkdir(targetPath)
    })
    .on('unlinkDir', p => {
      const targetPath = path.join(rootTargetLinkDir, p)
      log.debug(`Removing directory ${targetPath}`)
      shell.rm('-rf', targetPath)
    })
    .on('error', error => log.error(`Watcher error: ${error}`))
    .on('ready', () => log.debug('Initial scan complete. Watching for changes'))
}

function getPathToPackageInComposite(
  compositeDir: string,
  packageName: string
) {
  return path.join(compositeDir, 'node_modules', packageName)
}
