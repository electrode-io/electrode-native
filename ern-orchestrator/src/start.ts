import {
  createTmpDir,
  android,
  ios,
  config as ernConfig,
  PackagePath,
  NativeApplicationDescriptor,
  shell,
  reactnative,
  ErnBinaryStore,
  log,
  kax,
} from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import { generateMiniAppsComposite } from 'ern-container-gen'
import _ from 'lodash'
import chokidar from 'chokidar'
import path from 'path'
import fs from 'fs'

export default async function start({
  jsApiImpls,
  miniapps,
  descriptor,
  flavor,
  launchArgs,
  launchEnvVars,
  launchFlags,
  watchNodeModules = [],
  packageName,
  activityName,
  bundleId,
  extraJsDependencies,
  disableBinaryStore,
}: {
  jsApiImpls?: PackagePath[]
  miniapps?: PackagePath[]
  descriptor?: NativeApplicationDescriptor
  flavor?: string
  launchArgs?: string
  launchEnvVars?: string
  launchFlags?: string
  watchNodeModules?: string[]
  packageName?: string
  activityName?: string
  bundleId?: string
  extraJsDependencies?: PackagePath[]
  disableBinaryStore?: boolean
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

  if (descriptor) {
    miniapps = await cauldron.getContainerMiniApps(descriptor, {
      favorGitBranches: true,
    })
  }

  // Because this command can only be stoped through `CTRL+C` (or killing the process)
  // we listen for the SIGINT signal and then just exit the process
  // This is needed for tmp module to do its cleanup, otherwise the temporary directory
  // is not removed after `CTRL+C` is done
  process.on('SIGINT', () => process.exit())

  const compositeDir = createTmpDir()
  log.trace(`Temporary composite directory is ${compositeDir}`)

  await kax.task('Generating MiniApps composite').run(
    generateMiniAppsComposite(
      miniapps!,
      compositeDir,
      {
        extraJsDependencies: extraJsDependencies || undefined,
      },
      jsApiImpls
    )
  )

  const miniAppsLinksObj = ernConfig.getValue('miniAppsLinks', {})
  const linkedMiniAppsPackageNames = Object.keys(miniAppsLinksObj).filter(p =>
    fs.existsSync(miniAppsLinksObj[p])
  )

  linkedMiniAppsPackageNames.forEach(pkgName => {
    replacePackageInCompositeWithLinkedPackage(
      compositeDir,
      pkgName,
      miniAppsLinksObj[pkgName]
    )
    log.info(
      `Watching for changes in linked MiniApp directory ${
        miniAppsLinksObj[pkgName]
      }`
    )
    startLinkSynchronization(compositeDir, pkgName, miniAppsLinksObj[pkgName])
  })

  reactnative.startPackagerInNewWindow(compositeDir, [
    '--reset-cache',
    '--providesModuleNodeModules',
    `react-native,${linkedMiniAppsPackageNames
      .concat(watchNodeModules)
      .join(',')}`,
  ])

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
          await android.runAndroidApk({
            activityName,
            apkPath,
            launchFlags,
            packageName,
          })
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
          await ios.runIosApp({ appPath, bundleId, launchArgs, launchEnvVars })
        }
      }
    }
  }

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
  shell.rm(
    '-Rf',
    path.join(pathToPackageInComposite, 'node_modules', 'react-native')
  )
  shell.rm('-Rf', path.join(pathToPackageInComposite, 'node_modules', 'react'))
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
