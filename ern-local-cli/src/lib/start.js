import {
  android,
  ios,
  config as ernConfig,
  DependencyPath,
  NativeApplicationDescriptor,
  spin,
  shell
} from 'ern-util'
import {
  generateMiniAppsComposite
} from 'ern-container-gen'
import {
  cauldron,
  reactnative,
  ErnBinaryStore
} from 'ern-core'
import _ from 'lodash'
import chokidar from 'chokidar'
import tmp from 'tmp'
import path from 'path'

const {
  runAndroidApk
} = android

const {
  runIosApp
} = ios

export default async function start ({
  miniapps,
  descriptor,
  watchNodeModules = [],
  packageName,
  activityName,
  bundleId,
  extraJsDependencies
} : {
  miniapps?: Array<string>,
  descriptor?: string,
  watchNodeModules: Array<string>,
  packageName?: string,
  activityName?: string,
  bundleId?: string,
  extraJsDependencies?: Array<DependencyPath>
} = {}) {
  let miniAppsPaths: Array<DependencyPath> = _.map(miniapps, DependencyPath.fromString)
  let napDescriptor

  if (descriptor) {
    napDescriptor = NativeApplicationDescriptor.fromString(descriptor)
  }

  if (!miniapps) {
    if (!descriptor) {
      return log.error('You need to provide a descriptor if not providing miniapps')
    }
    const miniAppsObjs = await cauldron.getContainerMiniApps(napDescriptor)
    miniAppsPaths = _.map(miniAppsObjs, m => DependencyPath.fromString(m.toString()))
  }

  // Because this command can only be stoped through `CTRL+C` (or killing the process)
  // we listen for the SIGINT signal and then just exit the process
  // This is needed for tmp module to do its cleanup, otherwise the temporary directory
  // is not removed after `CTRL+C` is done
  process.on('SIGINT', () => process.exit())

  tmp.setGracefulCleanup(true)
  const workingDir = tmp.dirSync({ unsafeCleanup: true }).name
  log.debug(`Temporary working directory is ${workingDir}`)

  let pathToYarnLock
  if (descriptor) {
    pathToYarnLock = await cauldron.getPathToYarnLock(napDescriptor)
  }
  await spin('Generating MiniApps composite',
    generateMiniAppsComposite(miniAppsPaths, workingDir, {
      pathToYarnLock,
      extraJsDependencies
    }))

  let miniAppsLinks = ernConfig.getValue('miniAppsLinks', {})

  Object.keys(miniAppsLinks).forEach(linkName => {
    log.info(`Watching for changes in linked directory ${miniAppsLinks[linkName]}`)
    startLinkSynchronization(workingDir, linkName, miniAppsLinks[linkName])
  })

  reactnative.startPackagerInNewWindow(workingDir, [
    '--reset-cache',
    '--providesModuleNodeModules',
    `react-native,${Object.keys(miniAppsLinks).concat(watchNodeModules).join(',')}`
  ])

  if (descriptor) {
    const binaryStoreConfig = await cauldron.getBinaryStoreConfig()
    if (binaryStoreConfig) {
      const binaryStore = new ErnBinaryStore(binaryStoreConfig)
      if (await binaryStore.hasBinary(napDescriptor)) {
        if (napDescriptor.platform === 'android') {
          if (!packageName) {
            return log.error('You need to provide an Android package name')
          }
          const apkPath = await binaryStore.getBinary(napDescriptor)
          await runAndroidApk({apkPath, packageName, activityName})
        } else if (napDescriptor.platform === 'ios') {
          if (!bundleId) {
            return log.error('You need to provide an iOS bundle ID')
          }
          const appPath = await binaryStore.getBinary(napDescriptor)
          await runIosApp({appPath, bundleId})
        }
      }
    }
  }

  log.warn('=========================================================')
  log.warn('Ending this process will stop monitoring linked MiniApps.')
  log.warn('You can end this process once you are done, using CTRL+C.')
  log.warn('=========================================================')
}

function startLinkSynchronization (workingDir, linkName, sourceLinkDir) {
  log.debug(`startLinkSynchronization [${workingDir}] [${linkName}] [${sourceLinkDir}]`)

  const watcher = chokidar.watch(sourceLinkDir, {
    ignored: ['node_modules/**', 'android/**', 'ios/**', '.**'],
    cwd: sourceLinkDir,
    ignoreInitial: true,
    persistent: true
  })

  const rootTargetLinkDir = path.join(workingDir, 'node_modules', linkName)

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
