import {
  createTmpDir,
  android,
  ios,
  PackagePath,
  shell,
  reactnative,
  ErnBinaryStore,
  log,
  kax,
  readPackageJsonSync,
  AppVersionDescriptor,
  packageLinksConfig,
  listDirsRecursive,
  PackagesLinks,
} from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import { generateComposite } from 'ern-composite-gen'
import _ from 'lodash'
import chokidar from 'chokidar'
import path from 'path'
import fs from 'fs-extra'
import { ncp } from 'ncp'

export default async function start({
  baseComposite,
  compositeDir,
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
  host,
  port,
}: {
  baseComposite?: PackagePath
  compositeDir?: string
  jsApiImpls?: PackagePath[]
  miniapps?: PackagePath[]
  descriptor?: AppVersionDescriptor
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
    baseComposite = baseComposite || compositeGenConfig?.baseComposite
    resolutions = compositeGenConfig?.resolutions
  }

  // Because this command can only be stoped through `CTRL+C` (or killing the process)
  // we listen for the SIGINT signal and then just exit the process
  // This is needed for tmp module to do its cleanup, otherwise the temporary directory
  // is not removed after `CTRL+C` is done
  process.on('SIGINT', () => process.exit())

  compositeDir = compositeDir || createTmpDir()
  log.trace(`Temporary composite directory is ${compositeDir}`)

  await kax.task(`Generating composite in ${compositeDir}`).run(
    generateComposite({
      baseComposite,
      extraJsDependencies: extraJsDependencies || undefined,
      jsApiImplDependencies: jsApiImpls,
      miniApps: miniapps!,
      outDir: compositeDir,
      resolutions,
    })
  )

  const packagesLinks = packageLinksConfig.getAll()
  const linkedPackages = Object.keys(packagesLinks).filter(
    p =>
      fs.pathExistsSync(packagesLinks[p].localPath) &&
      packagesLinks[p].isEnabled
  )

  // Auto link file based miniapps
  miniapps!
    .filter(m => m.isFilePath)
    .forEach(m => {
      const packageJson = readPackageJsonSync(m.basePath)
      linkedPackages.push(packageJson.name)
      packagesLinks[packageJson.name] = {
        isEnabled: true,
        localPath: m.basePath,
      }
    })

  const linkedDirsByPackageName = await kax
    .task('Linking packages')
    .run(linkPackages(compositeDir, linkedPackages, packagesLinks))

  if (linkedPackages.length > 0) {
    log.info(`Linked packages`)
    for (const [k, v] of linkedDirsByPackageName.entries()) {
      log.info(`${k} package [${packagesLinks[k].localPath}] linked to:`)
      v.forEach(x => {
        log.info(`  ${x}`)
      })
    }
  }

  reactnative.startPackagerInNewWindow({
    cwd: compositeDir,
    host,
    port,
    provideModuleNodeModules: [
      'react-native',
      ...linkedPackages,
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
          if (cauldronStartCommandConfig?.android) {
            packageName =
              packageName ?? cauldronStartCommandConfig.android.packageName
            activityName =
              activityName ?? cauldronStartCommandConfig.android.activityName
          }
          if (!packageName) {
            throw new Error(
              'You need to provide an Android package name or set it in Cauldron configuration'
            )
          }
          const apkPath = await kax
            .task(
              'Downloading Android binary from Electrode Native binary store'
            )
            .run(binaryStore.getBinary(descriptor, { flavor }))
          await android.runAndroidApk({
            activityName,
            apkPath,
            launchFlags,
            packageName,
          })
        } else if (descriptor.platform === 'ios') {
          if (cauldronStartCommandConfig?.ios) {
            bundleId = bundleId ?? cauldronStartCommandConfig.ios.bundleId
          }
          if (!bundleId) {
            throw new Error(
              'You need to provide an iOS bundle ID or set it in Cauldron configuration'
            )
          }
          const appPath = await kax
            .task('Downloading iOS binary from Electrode Native binary store')
            .run(binaryStore.getBinary(descriptor, { flavor }))
          await ios.runIosApp({ appPath, bundleId, launchArgs, launchEnvVars })
        }
      }
    }
  }

  if (linkedPackages.length > 0) {
    linkedPackages.forEach(pkgName => {
      startLinkSynchronization(
        linkedDirsByPackageName.get(pkgName) || [],
        packagesLinks[pkgName].localPath
      )
    })
  }

  log.warn('=========================================================')
  log.warn('Ending this process will stop monitoring linked packages.')
  log.warn('You can end this process once you are done, using CTRL+C.')
  log.warn('=========================================================')

  // Trick to keep the Node process alive even if no MiniApps are linked (otherwise linked
  // MiniApps will keep process alive as they are registering event listeners)
  // We need to keep the process alive due to the fact that we create the composite
  // project in a temporary directory which gets destroyed upon process exit.
  // If the process exits too soon, then the packager (running in a separate process)
  // fails as the directory containing the files to package, does not exist anymore.
  if (linkedPackages.length === 0) {
    process.stdin.resume()
  }
}

async function linkPackages(
  rootDir: string,
  linkedPackages: string[],
  packagesLinks: PackagesLinks,
  maxDepth = 2
) {
  let linkedDirsByPackageName = new Map<string, string[]>()
  if (maxDepth === 0) {
    return linkedDirsByPackageName
  }

  log.debug(`Crawling ${rootDir} directory to find packages to link`)
  const linkedDirs = await findLinkedDirs(
    rootDir,
    linkedPackages.filter(p => !rootDir.endsWith(`${path.sep}${p}`))
  )

  if (linkedDirs.length === 0) {
    log.debug(`Found no package to link in ${rootDir}`)
    return linkedDirsByPackageName
  }

  linkedPackages.forEach(pkgName => {
    linkedDirsByPackageName.set(
      pkgName,
      linkedDirs.filter(d => d.endsWith(pkgName))
    )
  })

  // Copy all the linked packages
  log.debug('Linking packages')
  for (const linkedPackageName of linkedPackages) {
    const lDirs = linkedDirsByPackageName.get(linkedPackageName) || []
    if (lDirs.length > 0) {
      for (const linkedDir of lDirs) {
        await replacePackageWithLinkedPackage(
          linkedDir,
          packagesLinks[linkedPackageName].localPath
        )
      }
    }
  }

  // Recurse
  for (const linkedDir of _.flatten(
    Array.from(linkedDirsByPackageName.values())
  )) {
    const res = await linkPackages(
      linkedDir,
      linkedPackages,
      packagesLinks,
      maxDepth - 1
    )
    linkedDirsByPackageName = mergeMaps(linkedDirsByPackageName, res)
  }

  return linkedDirsByPackageName
}

function mergeMaps(
  a: Map<string, string[]>,
  b: Map<string, string[]>
): Map<string, string[]> {
  const res = new Map<string, string[]>()
  // get all keys from boths maps
  const keys = _.union(Array.from(a.keys()), Array.from(b.keys()))
  // go through all keys
  for (const key of keys) {
    if (a.has(key) && b.has(key)) {
      // both maps share this key, create a union of the values
      res.set(key, _.union(a.get(key), b.get(key)))
    } else if (a.has(key)) {
      // only map a has this key, copy over
      res.set(key, a.get(key)!)
    } else {
      // only map b has this key, copy over
      res.set(key, b.get(key)!)
    }
  }
  return res
}

async function replacePackageWithLinkedPackage(
  pathToPackageInComposite,
  sourceLinkDir
) {
  log.trace(
    `replacePackageWithLinkedPackage(${pathToPackageInComposite}, ${sourceLinkDir})`
  )
  // Don't need android and ios directories to be copied over to the Composite
  // Also exclude react-native and react to avoid haste collisions, as they are
  // already part of the top level composite node_modules
  // react-native-electrode-bridge is also excluded because having multiple
  // instances of it might create issues
  const excludedDirectories = [
    'android',
    'ios',
    'node_modules/react-native',
    'node_modules/react',
    'node_modules/react-native-electrode-bridge',
    '.git',
  ].map(f => path.join(sourceLinkDir, f))

  const excludedDirectoriesRE = new RegExp(
    `^((?!${excludedDirectories.map(f => `${f}$`).join('|')}).*)`
  )

  // Trash the package in the composite directory, and recreate it with current
  // local content, by recursively copying the whole local package directory.
  await fs.emptyDir(pathToPackageInComposite)

  // Use ncp for copy rather than fs-extra as it is more performant
  await new Promise((resolve, reject) => {
    ncp(
      sourceLinkDir,
      pathToPackageInComposite,
      {
        filter: excludedDirectoriesRE,
        limit: 512,
      } as any /* while waiting for https://github.com/DefinitelyTyped/DefinitelyTyped/pull/38883 to get merged */,
      err => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      }
    )
  })
}

async function findLinkedDirs(
  rootDir: string,
  linkedPackageNames: string[]
): Promise<string[]> {
  const allDirsInComposite = await listDirsRecursive(rootDir)
  const linkedDirRe = new RegExp(
    linkedPackageNames.map(p => `/${p}$`).join('|')
  )
  return allDirsInComposite.filter(dir => linkedDirRe.test(dir))
}

function startLinkSynchronization(
  targetLinkDirs: string[],
  sourceLinkDir: string
) {
  log.trace(`startLinkSynchronization [${targetLinkDirs}] [${sourceLinkDir}]`)

  const watcher = chokidar.watch(sourceLinkDir, {
    cwd: sourceLinkDir,
    ignoreInitial: true,
    ignored: ['android/**', 'ios/**', 'node_modules/**', '.git/**'],
    persistent: true,
  })

  watcher
    .on('add', p => {
      const sourcePath = path.join(sourceLinkDir, p)
      targetLinkDirs.forEach(d => {
        const targetPath = path.join(d, p)
        log.debug(`Copying ${sourcePath} to ${targetPath}`)
        shell.cp(sourcePath, targetPath)
      })
    })
    .on('change', p => {
      const sourcePath = path.join(sourceLinkDir, p)
      targetLinkDirs.forEach(d => {
        const targetPath = path.join(d, p)
        log.debug(`Copying ${sourcePath} to ${targetPath}`)
        shell.cp(sourcePath, targetPath)
      })
    })
    .on('unlink', p => {
      targetLinkDirs.forEach(d => {
        const targetPath = path.join(d, p)
        log.debug(`Removing ${targetPath}`)
        shell.rm(targetPath)
      })
    })
    .on('addDir', p => {
      targetLinkDirs.forEach(d => {
        const targetPath = path.join(d, p)
        log.debug(`Creating directory ${targetPath}`)
        shell.mkdir(targetPath)
      })
    })
    .on('unlinkDir', p => {
      targetLinkDirs.forEach(d => {
        const targetPath = path.join(d, p)
        log.debug(`Removing directory ${targetPath}`)
        shell.rm('-rf', targetPath)
      })
    })
    .on('error', error => log.error(`Watcher error: ${error}`))
    .on('ready', () => log.debug('Initial scan complete. Watching for changes'))
}
