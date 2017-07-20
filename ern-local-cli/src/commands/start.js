// @flow

import {
  generateMiniAppsComposite
} from '@walmart/ern-container-gen'
import {
  cauldron,
  Platform
} from '@walmart/ern-core'
import {
  config as ernConfig,
  DependencyPath,
  NativeApplicationDescriptor
} from '@walmart/ern-util'
import chokidar from 'chokidar'
import shell from 'shelljs'
import _ from 'lodash'
import tmp from 'tmp'
import path from 'path'
import childProcess from 'child_process'

exports.command = 'start'
exports.desc = 'Start a composite MiniApp'

exports.builder = function (yargs: any) {
  return yargs
    .option('completeNapDescriptor', {
      type: 'string',
      alias: 'n',
      describe: 'Full native application selector'
    })
    .option('miniapps', {
      type: 'array',
      alias: 'm',
      describe: 'A list of one or more miniapps'
    })
}

exports.handler = async function ({
  completeNapDescriptor,
  miniapps
} : {
  completeNapDescriptor?: string,
  miniapps?: Array<string>
}) {
  let miniAppsPaths: Array<DependencyPath> = _.map(miniapps, DependencyPath.fromString)

  if (!miniapps) {
    if (!completeNapDescriptor) {
      return log.error('You need to provide a completeNapDescriptor if not providing miniapps')
    }
    const miniAppsObjs = await cauldron.getContainerMiniApps(NativeApplicationDescriptor.fromString(completeNapDescriptor))
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

  await generateMiniAppsComposite(miniAppsPaths, workingDir)

  let miniAppsLinks = ernConfig.getValue('miniAppsLinks', {})

  Object.keys(miniAppsLinks).forEach(linkName => {
    log.info(`Watching for changes in linked directory ${miniAppsLinks[linkName]}`)
    startLinkSynchronization(workingDir, linkName, miniAppsLinks[linkName])
  })

  const reactNativeBinaryPath = `${Platform.currentPlatformVersionPath}/node_modules/.bin/react-native`
  const reactNativePackagerProcess = childProcess.spawn(reactNativeBinaryPath, [
    'start', '--reset-cache', '--providesModuleNodeModules', `react-native,${Object.keys(miniAppsLinks).join(',')}`])
  reactNativePackagerProcess.stdout.on('data', data => log.info(data.toString()))
  reactNativePackagerProcess.stderr.on('data', data => log.error(data.toString()))
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
