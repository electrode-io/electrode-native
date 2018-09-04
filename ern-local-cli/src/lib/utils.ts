import {
  log,
  createTmpDir,
  MiniApp,
  Platform,
  reactnative,
  yarn,
  ModuleTypes,
  android,
  ios,
  PackagePath,
  NativeApplicationDescriptor,
  shell,
  utils as coreUtils,
  NativePlatform,
  fileUtils,
  kax,
} from 'ern-core'
import { publishContainer } from 'ern-container-publisher'
import { transformContainer } from 'ern-container-transformer'
import { getActiveCauldron, cauldronFileUriScheme } from 'ern-cauldron-api'
import { RunnerGenerator, RunnerGeneratorConfig } from 'ern-runner-gen'
import { AndroidRunnerGenerator } from 'ern-runner-gen-android'
import { IosRunnerGenerator } from 'ern-runner-gen-ios'
import { runLocalContainerGen, runCauldronContainerGen } from './container'
import { spawn, spawnSync } from 'child_process'
import _ from 'lodash'
import inquirer from 'inquirer'
import semver from 'semver'
import Ensure from './Ensure'
import chalk from 'chalk'
import fs from 'fs'
import path from 'path'
import * as constants from './constants'
import yauzl from 'yauzl'
import yazl from 'yazl'
import readDir from 'fs-readdir-recursive'
import os from 'os'

const { runAndroidProject } = android

export const platformSupportedConfigAsString = () =>
  'Electrode Native Supports following keys :\n' +
  constants.availableUserConfigKeys
    .map(
      e =>
        `${e.name.padEnd(15)} : ${e.desc.padEnd(60)}  [${e.values.join('|')}]`
    )
    .join('\n') +
  '\n\n'

//
// Retrieves all native applications versions from the Cauldron, optionaly
// filtered by platform/and or release status and returns them as an array
// of native application descriptor strings
async function getNapDescriptorStringsFromCauldron({
  platform,
  onlyReleasedVersions,
  onlyNonReleasedVersions,
}: {
  platform?: NativePlatform
  onlyReleasedVersions?: boolean
  onlyNonReleasedVersions?: boolean
} = {}): Promise<string[]> {
  const cauldron = await getActiveCauldron()
  const nativeApps = await cauldron.getAllNativeApps()
  return <any>_.filter(
    _.flattenDeep(
      _.map(nativeApps, nativeApp =>
        _.map(nativeApp.platforms, p =>
          _.map(p.versions, version => {
            if (!platform || platform === p.name) {
              if (
                (version.isReleased && !onlyNonReleasedVersions) ||
                (!version.isReleased && !onlyReleasedVersions)
              ) {
                return `${nativeApp.name}:${p.name}:${version.name}`
              }
            }
          })
        )
      )
    ),
    elt => elt !== undefined
  )
}

//
// Ensure that some conditions are satisifed
// If not, log exception error message and exit process
async function logErrorAndExitIfNotSatisfied({
  noGitOrFilesystemPath,
  noFileSystemPath,
  isValidContainerVersion,
  isNewerContainerVersion,
  isCompleteNapDescriptorString,
  napDescriptorExistInCauldron,
  sameNativeApplicationAndPlatform,
  napDescritorDoesNotExistsInCauldron,
  publishedToNpm,
  miniAppNotInNativeApplicationVersionContainer,
  miniAppIsInNativeApplicationVersionContainer,
  miniAppIsInNativeApplicationVersionContainerWithDifferentVersion,
  dependencyNotInNativeApplicationVersionContainer,
  dependencyIsInNativeApplicationVersionContainer,
  dependencyIsInNativeApplicationVersionContainerWithDifferentVersion,
  dependencyNotInUseByAMiniApp,
  cauldronIsActive,
  isValidNpmPackageName,
  isValidElectrodeNativeModuleName,
  checkIfCodePushOptionsAreValid,
  isFilePath,
  isDirectoryPath,
  pathExist,
  isValidPlatformConfig,
}: {
  noGitOrFilesystemPath?: {
    obj: string | string[]
    extraErrorMessage?: string
  }
  noFileSystemPath?: {
    obj: string | string[]
    extraErrorMessage?: string
  }
  isValidContainerVersion?: {
    containerVersion: string
    extraErrorMessage?: string
  }
  isNewerContainerVersion?: {
    descriptor: string
    containerVersion: string
    extraErrorMessage?: string
  }
  isCompleteNapDescriptorString?: {
    descriptor: string
    extraErrorMessage?: string
  }
  napDescriptorExistInCauldron?: {
    descriptor: string | string[]
    extraErrorMessage?: string
  }
  sameNativeApplicationAndPlatform?: {
    descriptors: string[]
    extraErrorMessage?: string
  }
  napDescritorDoesNotExistsInCauldron?: {
    descriptor: string
    extraErrorMessage?: string
  }
  publishedToNpm?: {
    obj: string | string[]
    extraErrorMessage?: string
  }
  miniAppNotInNativeApplicationVersionContainer?: {
    miniApp: string | string[] | void
    napDescriptor: NativeApplicationDescriptor
    extraErrorMessage?: string
  }
  miniAppIsInNativeApplicationVersionContainer?: {
    miniApp: string | string[] | void
    napDescriptor: NativeApplicationDescriptor
    extraErrorMessage?: string
  }
  miniAppIsInNativeApplicationVersionContainerWithDifferentVersion?: {
    miniApp: string | string[] | void
    napDescriptor: NativeApplicationDescriptor
    extraErrorMessage?: string
  }
  dependencyNotInNativeApplicationVersionContainer?: {
    dependency: string | string[] | void
    napDescriptor: NativeApplicationDescriptor
    extraErrorMessage?: string
  }
  dependencyIsInNativeApplicationVersionContainer?: {
    dependency: string | string[] | void
    napDescriptor: NativeApplicationDescriptor
    extraErrorMessage?: string
  }
  dependencyIsInNativeApplicationVersionContainerWithDifferentVersion?: {
    dependency: string | string[] | void
    napDescriptor: NativeApplicationDescriptor
    extraErrorMessage?: string
  }
  dependencyNotInUseByAMiniApp?: {
    dependency: string | string[] | void
    napDescriptor: NativeApplicationDescriptor
    extraErrorMessage?: string
  }
  cauldronIsActive?: {
    extraErrorMessage?: string
  }
  isValidNpmPackageName?: {
    name: string
    extraErrorMessage?: string
  }
  isValidElectrodeNativeModuleName?: {
    name: string
    extraErrorMessage?: string
  }
  checkIfCodePushOptionsAreValid?: {
    descriptors?: string[]
    targetBinaryVersion?: string
    semVerDescriptor?: string
    extraErrorMessage?: string
  }
  isFilePath?: {
    p: fs.PathLike
    extraErrorMessage?: string
  }
  isDirectoryPath?: {
    p: fs.PathLike
    extraErrorMessage?: string
  }
  pathExist?: {
    p: fs.PathLike
    extraErrorMessage?: string
  }
  isValidPlatformConfig?: {
    key: string
  }
} = {}) {
  let kaxTask
  try {
    if (cauldronIsActive) {
      kaxTask = kax.task('Ensuring that a Cauldron is active')
      await Ensure.cauldronIsActive(cauldronIsActive.extraErrorMessage)
      kaxTask.succeed()
    }
    if (isValidContainerVersion) {
      kaxTask = kax.task(
        `Ensuring that ${
          isValidContainerVersion.containerVersion
        } is a valid Container version`
      )
      Ensure.isValidContainerVersion(
        isValidContainerVersion.containerVersion,
        isValidContainerVersion.extraErrorMessage
      )
      kaxTask.succeed()
    }
    if (isNewerContainerVersion) {
      kaxTask = kax.task(
        'Ensuring that container version is newer compared to the current one'
      )
      await Ensure.isNewerContainerVersion(
        isNewerContainerVersion.descriptor,
        isNewerContainerVersion.containerVersion,
        isNewerContainerVersion.extraErrorMessage
      )
      kaxTask.succeed()
    }
    if (isCompleteNapDescriptorString) {
      kaxTask = kax.task(
        'Ensuring that native application descriptor is complete'
      )
      Ensure.isCompleteNapDescriptorString(
        isCompleteNapDescriptorString.descriptor,
        isCompleteNapDescriptorString.extraErrorMessage
      )
      kaxTask.succeed()
    }
    if (noGitOrFilesystemPath) {
      kaxTask = kax.task(
        'Ensuring that not git or file system path(s) is/are used'
      )
      Ensure.noGitOrFilesystemPath(
        noGitOrFilesystemPath.obj,
        noGitOrFilesystemPath.extraErrorMessage
      )
      kaxTask.succeed()
    }
    if (noFileSystemPath) {
      kaxTask = kax.task('Ensuring that no file system path(s) is/are used')
      Ensure.noFileSystemPath(
        noFileSystemPath.obj,
        noFileSystemPath.extraErrorMessage
      )
      kaxTask.succeed()
    }
    if (napDescriptorExistInCauldron) {
      kaxTask = kax.task(
        'Ensuring that native application descriptor exists in Cauldron'
      )
      await Ensure.napDescritorExistsInCauldron(
        napDescriptorExistInCauldron.descriptor,
        napDescriptorExistInCauldron.extraErrorMessage
      )
      kaxTask.succeed()
    }
    if (sameNativeApplicationAndPlatform) {
      kaxTask = kax.task(
        'Ensuring that all descriptors are for the same native application and platform'
      )
      Ensure.sameNativeApplicationAndPlatform(
        sameNativeApplicationAndPlatform.descriptors,
        sameNativeApplicationAndPlatform.extraErrorMessage
      )
      kaxTask.succeed()
    }
    if (napDescritorDoesNotExistsInCauldron) {
      kaxTask = kax.task(
        'Ensuring that native application descriptor does not already exist in Cauldron'
      )
      await Ensure.napDescritorDoesNotExistsInCauldron(
        napDescritorDoesNotExistsInCauldron.descriptor,
        napDescritorDoesNotExistsInCauldron.extraErrorMessage
      )
      kaxTask.succeed()
    }
    if (publishedToNpm) {
      kaxTask = kax.task(
        'Ensuring that package(s) version(s) have been published to NPM'
      )
      await Ensure.publishedToNpm(
        publishedToNpm.obj,
        publishedToNpm.extraErrorMessage
      )
      kaxTask.succeed()
    }
    if (miniAppNotInNativeApplicationVersionContainer) {
      kaxTask = kax.task(
        'Ensuring that MiniApp(s) is/are not present in native application version container'
      )
      await Ensure.miniAppNotInNativeApplicationVersionContainer(
        miniAppNotInNativeApplicationVersionContainer.miniApp,
        miniAppNotInNativeApplicationVersionContainer.napDescriptor,
        miniAppNotInNativeApplicationVersionContainer.extraErrorMessage
      )
      kaxTask.succeed()
    }
    if (miniAppIsInNativeApplicationVersionContainer) {
      kaxTask = kax.task(
        'Ensuring that MiniApp(s) is/are present in native application version container'
      )
      await Ensure.miniAppIsInNativeApplicationVersionContainer(
        miniAppIsInNativeApplicationVersionContainer.miniApp,
        miniAppIsInNativeApplicationVersionContainer.napDescriptor,
        miniAppIsInNativeApplicationVersionContainer.extraErrorMessage
      )
      kaxTask.succeed()
    }
    if (miniAppIsInNativeApplicationVersionContainerWithDifferentVersion) {
      kaxTask = kax.task(
        'Ensuring that MiniApp(s) is/are present in native application version container with different version(s)'
      )
      await Ensure.miniAppIsInNativeApplicationVersionContainerWithDifferentVersion(
        miniAppIsInNativeApplicationVersionContainerWithDifferentVersion.miniApp,
        miniAppIsInNativeApplicationVersionContainerWithDifferentVersion.napDescriptor,
        miniAppIsInNativeApplicationVersionContainerWithDifferentVersion.extraErrorMessage
      )
      kaxTask.succeed()
    }
    if (dependencyNotInNativeApplicationVersionContainer) {
      kaxTask = kax.task(
        'Ensuring that dependency(ies) is/are not present in native application version container'
      )
      await Ensure.dependencyNotInNativeApplicationVersionContainer(
        dependencyNotInNativeApplicationVersionContainer.dependency,
        dependencyNotInNativeApplicationVersionContainer.napDescriptor,
        dependencyNotInNativeApplicationVersionContainer.extraErrorMessage
      )
      kaxTask.succeed()
    }
    if (dependencyIsInNativeApplicationVersionContainer) {
      kaxTask = kax.task(
        'Ensuring that dependency(ies) is/are present in native application version container'
      )
      await Ensure.dependencyIsInNativeApplicationVersionContainer(
        dependencyIsInNativeApplicationVersionContainer.dependency,
        dependencyIsInNativeApplicationVersionContainer.napDescriptor,
        dependencyIsInNativeApplicationVersionContainer.extraErrorMessage
      )
      kaxTask.succeed()
    }
    if (dependencyIsInNativeApplicationVersionContainerWithDifferentVersion) {
      kaxTask = kax.task(
        'Ensuring that dependency(ies) is/are present in native application version container with different version(s)'
      )
      await Ensure.dependencyIsInNativeApplicationVersionContainerWithDifferentVersion(
        dependencyIsInNativeApplicationVersionContainerWithDifferentVersion.dependency,
        dependencyIsInNativeApplicationVersionContainerWithDifferentVersion.napDescriptor,
        dependencyIsInNativeApplicationVersionContainerWithDifferentVersion.extraErrorMessage
      )
      kaxTask.succeed()
    }
    if (dependencyNotInUseByAMiniApp) {
      kaxTask = kax.task(
        'Ensuring that no MiniApp(s) is/are using a dependency'
      )
      await Ensure.dependencyNotInUseByAMiniApp(
        dependencyNotInUseByAMiniApp.dependency,
        dependencyNotInUseByAMiniApp.napDescriptor,
        dependencyNotInUseByAMiniApp.extraErrorMessage
      )
      kaxTask.succeed()
    }
    if (isValidNpmPackageName) {
      kaxTask = kax.task('Ensuring that NPM package name is valid')
      await Ensure.isValidNpmPackageName(
        isValidNpmPackageName.name,
        isValidNpmPackageName.extraErrorMessage
      )
      kaxTask.succeed()
    }
    if (isValidElectrodeNativeModuleName) {
      kaxTask = kax.task('Ensuring that Electrode Native module name is valid')
      await Ensure.isValidElectrodeNativeModuleName(
        isValidElectrodeNativeModuleName.name,
        isValidElectrodeNativeModuleName.extraErrorMessage
      )
      kaxTask.succeed()
    }
    if (checkIfCodePushOptionsAreValid) {
      kaxTask = kax.task(
        'Ensuring that preconditions for code-push command are valid'
      )
      Ensure.checkIfCodePushOptionsAreValid(
        checkIfCodePushOptionsAreValid.descriptors,
        checkIfCodePushOptionsAreValid.targetBinaryVersion,
        checkIfCodePushOptionsAreValid.semVerDescriptor,
        checkIfCodePushOptionsAreValid.extraErrorMessage
      )
      kaxTask.succeed()
    }
    if (pathExist) {
      kaxTask = kax.task('Ensuring that path exist')
      await Ensure.pathExist(pathExist.p)
      kaxTask.succeed()
    }
    if (isFilePath) {
      kaxTask = kax.task('Ensuring that path is a file path')
      await Ensure.isFilePath(isFilePath.p)
      kaxTask.succeed()
    }
    if (isDirectoryPath) {
      kaxTask = kax.task('Ensuring that path is a directory path')
      await Ensure.isDirectoryPath(isDirectoryPath.p)
      kaxTask.succeed()
    }
    if (isValidPlatformConfig) {
      kaxTask = kax.task('Ensuring that config key is whitelisted')
      Ensure.isValidPlatformConfig(isValidPlatformConfig.key)
      kaxTask.succeed()
    }
  } catch (e) {
    kaxTask.fail(e.message)
    coreUtils.logErrorAndExitProcess(e, 1)
  }
}

//
// Inquire user to choose a native application version from the Cauldron, optionally
// filtered by platform/and or release status and returns the selected one as a string
async function askUserToChooseANapDescriptorFromCauldron({
  platform,
  onlyReleasedVersions,
  onlyNonReleasedVersions,
  message,
}: {
  platform?: NativePlatform
  onlyReleasedVersions?: boolean
  onlyNonReleasedVersions?: boolean
  message?: string
} = {}): Promise<string> {
  const napDescriptorStrings = await getNapDescriptorStringsFromCauldron({
    onlyNonReleasedVersions,
    onlyReleasedVersions,
    platform,
  })

  if (_.isEmpty(napDescriptorStrings)) {
    throw new Error(
      'Could not find any qualifying native application version in the Cauldron'
    )
  }

  const { userSelectedCompleteNapDescriptor } = await inquirer.prompt([
    <inquirer.Question>{
      choices: napDescriptorStrings,
      message: message || 'Choose a native application version',
      name: 'userSelectedCompleteNapDescriptor',
      type: 'list',
    },
  ])

  return userSelectedCompleteNapDescriptor
}

//
// Inquire user to choose one or more native application version(s) from the Cauldron, optionally
// filtered by platform/and or release status and returns the selected choices as an array of strings
async function askUserToChooseOneOrMoreNapDescriptorFromCauldron({
  platform,
  onlyReleasedVersions,
  onlyNonReleasedVersions,
  message,
}: {
  platform?: NativePlatform
  onlyReleasedVersions?: boolean
  onlyNonReleasedVersions?: boolean
  message?: string
} = {}): Promise<string[]> {
  const napDescriptorStrings = await getNapDescriptorStringsFromCauldron({
    onlyNonReleasedVersions,
    onlyReleasedVersions,
    platform,
  })

  if (_.isEmpty(napDescriptorStrings)) {
    throw new Error(
      'Could not find any qualifying native application version in the Cauldron'
    )
  }

  const { userSelectedCompleteNapDescriptors } = await inquirer.prompt([
    <inquirer.Question>{
      choices: napDescriptorStrings,
      message: message || 'Choose a native application version',
      name: 'userSelectedCompleteNapDescriptors',
      type: 'checkbox',
    },
  ])

  return userSelectedCompleteNapDescriptors
}

//
// Perform some custom work on a container in Cauldron, provided as a
// function, that is going to change the state of the container,
// and regenerate a new container and publish it.
// If any part of this function fails, the Cauldron will not get updated
async function performContainerStateUpdateInCauldron(
  stateUpdateFunc: () => Promise<any>,
  napDescriptor: NativeApplicationDescriptor,
  commitMessage: string | string[],
  {
    containerVersion,
    forceFullGeneration,
  }: {
    containerVersion?: string
    forceFullGeneration?: boolean
  } = {}
) {
  if (!napDescriptor.platform) {
    throw new Error(
      `napDescriptor (${napDescriptor.toString()}) does not contain a platform`
    )
  }

  const platform = napDescriptor.platform
  const outDir = path.join(
    Platform.rootDirectory,
    'containergen',
    'out',
    platform
  )
  let cauldronContainerVersion
  let cauldron
  let containerGenConfig

  try {
    cauldron = await getActiveCauldron()

    containerGenConfig = await cauldron.getContainerGeneratorConfig(
      napDescriptor
    )

    if (containerVersion) {
      cauldronContainerVersion = containerVersion
    } else {
      cauldronContainerVersion = await cauldron.getTopLevelContainerVersion(
        napDescriptor
      )
      if (cauldronContainerVersion) {
        cauldronContainerVersion = semver.inc(cauldronContainerVersion, 'patch')
      } else {
        // Default to 1.0.0 for Container version
        cauldronContainerVersion = '1.0.0'
      }
    }

    // Begin a Cauldron transaction
    await cauldron.beginTransaction()

    // Perform the custom container state update
    await stateUpdateFunc()

    const compositeMiniAppDir = createTmpDir()

    // Run container generator
    const containerGenResult = await runCauldronContainerGen(napDescriptor, {
      compositeMiniAppDir,
      forceFullGeneration,
      outDir,
    })

    // Update container version in Cauldron
    await cauldron.updateContainerVersion(
      napDescriptor,
      cauldronContainerVersion
    )

    // Update version of ern used to generate this Container
    await cauldron.updateContainerErnVersion(
      napDescriptor,
      Platform.currentVersion
    )

    // Update yarn lock
    const pathToNewYarnLock = path.join(compositeMiniAppDir, 'yarn.lock')
    await cauldron.addOrUpdateYarnLock(
      napDescriptor,
      constants.CONTAINER_YARN_KEY,
      pathToNewYarnLock
    )

    // Run Container transformers sequentially (if any)
    // Only run them if the Container was fully generated and not the JS Bundle only
    // If only JS bundle was generated, it means that we reused previous Container
    // directory, which was already transformed
    if (containerGenResult && !containerGenResult.generatedJsBundleOnly) {
      await runContainerTransformers({ napDescriptor, containerPath: outDir })
    }

    // Commit Cauldron transaction
    await kax
      .task('Updating Cauldron')
      .run(cauldron.commitTransaction(commitMessage))

    log.info(
      `Added new container version ${cauldronContainerVersion} for ${napDescriptor.toString()} in Cauldron`
    )
  } catch (e) {
    log.error(`[performContainerStateUpdateInCauldron] An error occurred: ${e}`)
    if (cauldron) {
      cauldron.discardTransaction()
    }
    throw e
  }

  return runContainerPublishers({
    containerPath: outDir,
    containerVersion: cauldronContainerVersion,
    napDescriptor,
  })
}

/**
 * Given a full Native Appplication Descriptor and a local Container path,
 * run all Container Transformers configured in Cauldron
 */
async function runContainerTransformers({
  napDescriptor,
  containerPath,
}: {
  napDescriptor: NativeApplicationDescriptor
  containerPath: string
}) {
  if (!napDescriptor.platform || !napDescriptor.version) {
    throw new Error('Can only work with a full native application descriptor')
  }

  const cauldron = await getActiveCauldron()

  const containerGenConfig = await cauldron.getContainerGeneratorConfig(
    napDescriptor
  )

  const transformersFromCauldron =
    containerGenConfig && containerGenConfig.transformers

  for (const transformerFromCauldron of transformersFromCauldron || []) {
    let extra = transformerFromCauldron.extra
    if (
      extra &&
      typeof extra === 'string' &&
      extra.startsWith(cauldronFileUriScheme)
    ) {
      if (!(await cauldron.hasFile({ cauldronFilePath: extra }))) {
        throw new Error(
          `Cannot find transformer extra config file ${extra} in Cauldron`
        )
      }
      const extraFile = await cauldron.getFile({ cauldronFilePath: extra })
      extra = parseJsonFromStringOrFile(extraFile.toString())
    }
    await kax
      .task(`Running Container Transformer ${transformerFromCauldron.name}`)
      .run(
        transformContainer({
          containerPath,
          extra,
          platform: napDescriptor.platform,
          transformer: transformerFromCauldron.name,
        })
      )
  }
}

/**
 * Given a full Native Appplication Descriptor and a local Container path,
 * run all Container Publishers configured in Cauldron
 */
async function runContainerPublishers({
  napDescriptor,
  containerPath,
  containerVersion,
}: {
  napDescriptor: NativeApplicationDescriptor
  containerPath: string
  containerVersion: string
}) {
  if (!napDescriptor.platform || !napDescriptor.version) {
    throw new Error('Can only work with a full native application descriptor')
  }

  const cauldron = await getActiveCauldron()

  const containerGenConfig = await cauldron.getContainerGeneratorConfig(
    napDescriptor
  )

  const publishersFromCauldron =
    containerGenConfig && containerGenConfig.publishers
  if (publishersFromCauldron) {
    for (const publisherFromCauldron of publishersFromCauldron || []) {
      let extra = publisherFromCauldron.extra
      if (!extra) {
        extra = getDefaultExtraConfigurationOfPublisherFromCauldron({
          napDescriptor,
          publisherFromCauldron,
        })
      } else if (
        typeof extra === 'string' &&
        extra.startsWith(cauldronFileUriScheme)
      ) {
        if (!(await cauldron.hasFile({ cauldronFilePath: extra }))) {
          throw new Error(
            'Cannot find publisher extra config file ${extra} in Cauldron'
          )
        }
        const extraFile = await cauldron.getFile({ cauldronFilePath: extra })
        extra = parseJsonFromStringOrFile(extraFile.toString())
      }

      // ==================================================================
      // Legacy code. To be deprecated
      let publisherName = publisherFromCauldron.name
      if (publisherName === 'github') {
        log.warn(
          `Your Cauldron is using the 'github' publisher which has been deprecated.
Please rename 'github' publisher name to 'git' in your Cauldron to get rid of this warning.`
        )
        publisherName = 'git'
      }
      // ==================================================================

      await kax.task(`Running Container Publisher ${publisherName}`).run(
        publishContainer({
          containerPath,
          containerVersion,
          extra,
          platform: napDescriptor.platform,
          publisher: publisherName,
          url: publisherFromCauldron.url,
        })
      )
    }
    log.info(
      `Published new Container version ${containerVersion} for ${napDescriptor.toString()}`
    )
  }
}

function getDefaultExtraConfigurationOfPublisherFromCauldron({
  publisherFromCauldron,
  napDescriptor,
}: {
  publisherFromCauldron: any
  napDescriptor: NativeApplicationDescriptor
}): any {
  if (
    publisherFromCauldron.name === 'maven' ||
    publisherFromCauldron.name.startsWith('maven@')
  ) {
    return {
      artifactId: `${napDescriptor.name}-ern-container`,
      groupId: 'com.walmartlabs.ern',
      mavenPassword: publisherFromCauldron.mavenPassword,
      mavenUser: publisherFromCauldron.mavenUser,
    }
  } else if (
    publisherFromCauldron.name === 'jcenter' ||
    publisherFromCauldron.name.startsWith('jcenter@')
  ) {
    return {
      artifactId: `${napDescriptor.name}-ern-container`,
      groupId: 'com.walmartlabs.ern',
    }
  }
}

async function createZippedBundle({
  bundlePath,
  assetsPath,
}: {
  bundlePath: string
  assetsPath: string
}): Promise<Buffer> {
  log.debug('Creating zipped bundle')
  const zippedbundle = new yazl.ZipFile()
  log.trace(`Adding ${bundlePath} to zipped bundle`)
  zippedbundle.addFile(bundlePath, path.basename(bundlePath))
  const assetsFiles = readDir(assetsPath)
  for (const assetFile of assetsFiles) {
    const pathToAssetFile = path.join(assetsPath, assetFile)
    log.trace(`Adding ${pathToAssetFile} to zipped bundle`)
    zippedbundle.addFile(pathToAssetFile, assetFile)
  }
  zippedbundle.end()

  const chunks: any = []
  zippedbundle.outputStream.on('data', chunk => {
    chunks.push(chunk)
  })

  return new Promise<Buffer>((resolve, reject) => {
    zippedbundle.outputStream.on('error', err => {
      reject(err)
    })
    zippedbundle.outputStream.on('end', () => {
      log.debug('Bundle was successfully zipped')
      resolve(Buffer.concat(chunks))
    })
  })
}

function epilog({ command }: { command: string }) {
  const version = `v${semver.major(Platform.currentVersion)}.${semver.minor(
    Platform.currentVersion
  )}`
  const rootUrl = `https://native.electrode.io/v/${version}/cli-commands`
  const commandWithoutOptions = command.split(' ')[0]
  const idx = _.indexOf(process.argv, commandWithoutOptions)
  let commandPath = _.slice(process.argv, 2, idx).join('/')
  commandPath = commandPath ? `/${commandPath}` : ''
  return `More info about this command @ ${chalk.bold(
    `${rootUrl}${commandPath}/${commandWithoutOptions}.html`
  )}`
}

const getDefaultMavenLocalDirectory = () => {
  const pathToRepository = path.join(os.homedir(), '.m2', 'repository')
  return `file://${pathToRepository}`
}

async function runMiniApp(
  platform: NativePlatform,
  {
    mainMiniAppName,
    miniapps,
    jsApiImpls,
    dependencies,
    descriptor,
    dev,
    host,
    port,
  }: {
    mainMiniAppName?: string
    miniapps?: string[]
    jsApiImpls?: string[]
    dependencies?: string[]
    descriptor?: string
    dev?: boolean
    host?: string
    port?: string
  } = {}
) {
  const cwd = process.cwd()

  let napDescriptor: NativeApplicationDescriptor | void

  if (miniapps && !mainMiniAppName) {
    throw new Error(
      'If you run multiple MiniApps you need to provide the name of the MiniApp to launch'
    )
  }

  if (miniapps && dev) {
    dev = false
    log.warn(
      'Turning off dev mode since you are running multiple MiniApps. \nIf you want to start a packager, execute `ern start` command with all the miniapps in a separate terminal.\nCheck this link for more details: https://native.electrode.io/cli-commands/start'
    )
  }

  if (dependencies && dependencies.length > 0 && descriptor) {
    throw new Error(
      'You cannot pass extra native dependencies when using a Native Application Descriptor'
    )
  }

  if (jsApiImpls && jsApiImpls.length > 0 && descriptor) {
    throw new Error(
      'You cannot pass Javascript API implementations when using a Native Application Descriptor'
    )
  }

  if (miniapps && descriptor) {
    throw new Error('You cannot use miniapps and descriptor at the same time')
  }

  let cauldron
  if (descriptor) {
    cauldron = await getActiveCauldron()
    if (cauldron == null) {
      throw new Error('[runMiniApp] No cauldron instance found')
    }
    await logErrorAndExitIfNotSatisfied({
      isCompleteNapDescriptorString: { descriptor },
      napDescriptorExistInCauldron: {
        descriptor,
        extraErrorMessage:
          'You cannot create a Runner for a non existing native application version.',
      },
    })

    napDescriptor = NativeApplicationDescriptor.fromString(descriptor)
  }

  let entryMiniAppName = mainMiniAppName || ''
  let dependenciesObjs: PackagePath[] = []
  let miniAppsPaths: PackagePath[] = []
  if (miniapps) {
    if (MiniApp.existInPath(cwd)) {
      const miniapp = MiniApp.fromPath(cwd)
      miniAppsPaths = [PackagePath.fromString(`file:${cwd}`)]
      log.debug(
        `This command is being run from the ${miniapp.name} MiniApp directory.`
      )
      log.info(
        `All extra MiniApps will be included in the Runner container along with ${
          miniapp.name
        }`
      )
      if (!mainMiniAppName) {
        log.info(`${miniapp.name} will be set as the main MiniApp`)
        log.info(
          `You can select another one instead through '--mainMiniAppName' option`
        )
        entryMiniAppName = miniapp.name
      }
    }
    dependenciesObjs = _.map(dependencies, d => PackagePath.fromString(d))
    miniAppsPaths = miniAppsPaths.concat(
      _.map(miniapps, m => PackagePath.fromString(m))
    )
  } else if (!miniapps && !descriptor) {
    entryMiniAppName = MiniApp.fromCurrentPath().name
    log.debug(
      `This command is being run from the ${entryMiniAppName} MiniApp directory.`
    )
    log.debug(`Initializing Runner`)
    dependenciesObjs = _.map(dependencies, d => PackagePath.fromString(d))
    miniAppsPaths = [PackagePath.fromString(`file:${cwd}`)]
    if (dev) {
      const args: string[] = []
      if (host) {
        args.push(`--host ${host}`)
      }
      if (port) {
        args.push(`--port ${port}`)
      }
      await reactnative.startPackagerInNewWindow(cwd, args)
    } else {
      log.info('Dev mode not enabled, will not start the packager.')
    }
  } else {
    miniAppsPaths =
      (cauldron &&
        napDescriptor &&
        (await cauldron.getContainerMiniApps(napDescriptor))) ||
      []
  }

  let jsApiImplsPaths: PackagePath[] = []

  if (jsApiImpls) {
    jsApiImplsPaths = _.map(jsApiImpls, j => PackagePath.fromString(j))
  }
  if (descriptor) {
    jsApiImplsPaths =
      (cauldron &&
        napDescriptor &&
        (await cauldron.getContainerJsApiImpls(napDescriptor))) ||
      []
  }

  const outDir = path.join(
    Platform.rootDirectory,
    'containergen',
    'out',
    platform
  )
  await generateContainerForRunner(platform, {
    dependenciesObjs,
    jsApiImplsPaths,
    miniAppsPaths,
    napDescriptor: napDescriptor || undefined,
    outDir,
  })

  if (platform === 'android') {
    await publishContainer({
      containerPath: outDir,
      containerVersion: '1.0.0',
      extra: {
        artifactId: 'runner-ern-container',
        groupId: 'com.walmartlabs.ern',
      },
      platform: 'android',
      publisher: 'maven',
      url: getDefaultMavenLocalDirectory(),
    })
  }

  const pathToRunner = path.join(cwd, platform)

  const runnerGeneratorConfig: RunnerGeneratorConfig = {
    extra: {
      containerGenWorkingDir: Platform.containerGenDirectory,
    },
    mainMiniAppName: entryMiniAppName,
    outDir: pathToRunner,
    reactNativeDevSupportEnabled: dev,
    reactNativePackagerHost: host,
    reactNativePackagerPort: port,
    targetPlatform: platform,
  }

  if (!fs.existsSync(pathToRunner)) {
    shell.mkdir('-p', pathToRunner)
    await kax
      .task(`Generating ${platform} Runner project`)
      .run(
        getRunnerGeneratorForPlatform(platform).generate(runnerGeneratorConfig)
      )
  } else {
    await kax
      .task(`Regenerating ${platform} Runner Configuration`)
      .run(
        getRunnerGeneratorForPlatform(platform).regenerateRunnerConfig(
          runnerGeneratorConfig
        )
      )
  }

  await launchRunner({
    host,
    pathToRunner,
    platform,
    port,
  })
}

function getRunnerGeneratorForPlatform(platform: string): RunnerGenerator {
  switch (platform) {
    case 'android':
      return new AndroidRunnerGenerator()
    case 'ios':
      return new IosRunnerGenerator()
    default:
      throw new Error(`Unsupported platform : ${platform}`)
  }
}

async function generateContainerForRunner(
  platform: NativePlatform,
  {
    napDescriptor,
    dependenciesObjs = [],
    miniAppsPaths = [],
    jsApiImplsPaths = [],
    outDir,
  }: {
    napDescriptor?: NativeApplicationDescriptor
    dependenciesObjs: PackagePath[]
    miniAppsPaths: PackagePath[]
    jsApiImplsPaths: PackagePath[]
    outDir: string
  }
) {
  if (napDescriptor) {
    await runCauldronContainerGen(napDescriptor, {
      outDir,
    })
  } else {
    await runLocalContainerGen(miniAppsPaths, jsApiImplsPaths, platform, {
      extraNativeDependencies: dependenciesObjs,
      outDir,
    })
  }
}

async function launchRunner({
  platform,
  pathToRunner,
  host,
  port,
}: {
  platform: string
  pathToRunner: string
  host?: string
  port?: string
}) {
  if (platform === 'android') {
    return launchAndroidRunner(pathToRunner)
  } else if (platform === 'ios') {
    return launchIosRunner(pathToRunner)
  }
}

async function launchAndroidRunner(pathToAndroidRunner: string) {
  return runAndroidProject({
    packageName: 'com.walmartlabs.ern',
    projectPath: pathToAndroidRunner,
  })
}

async function launchIosRunner(pathToIosRunner: string) {
  const iosDevices = ios.getiPhoneRealDevices()
  if (iosDevices && iosDevices.length > 0) {
    launchOnDevice(pathToIosRunner, iosDevices)
  } else {
    launchOnSimulator(pathToIosRunner)
  }
}

async function launchOnDevice(pathToIosRunner: string, devices) {
  const iPhoneDevice = await ios.askUserToSelectAniPhoneDevice(devices)
  shell.pushd(pathToIosRunner)

  try {
    await kax
      .task('Building iOS Runner project')
      .run(buildIosRunner(pathToIosRunner, iPhoneDevice.udid))

    const kaxDeployTask = kax.task(
      `Installing iOS Runner on ${iPhoneDevice.name}`
    )
    try {
      const iosDeployInstallArgs = [
        '--bundle',
        `${pathToIosRunner}/build/Debug-iphoneos/ErnRunner.app`,
        '--id',
        iPhoneDevice.udid,
        '--justlaunch',
      ]
      const iosDeployOutput = spawnSync('ios-deploy', iosDeployInstallArgs, {
        encoding: 'utf8',
      })
      if (iosDeployOutput.error) {
        kaxDeployTask.fail(
          `Installation failed. Make sure you have run 'npm install -g ios-deploy'.`
        )
      } else {
        kaxDeployTask.succeed()
      }
    } catch (e) {
      kaxDeployTask.fail(e.message)
      throw e
    }
  } finally {
    shell.popd()
  }
}

async function launchOnSimulator(pathToIosRunner: string) {
  const iPhoneSim = await ios.askUserToSelectAniPhoneSimulator()
  await kax
    .task('Killing all running Simulators')
    .run(ios.killAllRunningSimulators())
  await kax
    .task('Booting iOS Simulator')
    .run(ios.launchSimulator(iPhoneSim.udid))
  shell.pushd(pathToIosRunner)
  try {
    await kax
      .task('Building iOS Runner project')
      .run(buildIosRunner(pathToIosRunner, iPhoneSim.udid))
    await kax
      .task('Installing iOS Runner on Simulator')
      .run(
        ios.installApplicationOnSimulator(
          iPhoneSim.udid,
          `${pathToIosRunner}/build/Debug-iphonesimulator/ErnRunner.app`
        )
      )
    await kax
      .task('Launching Runner')
      .run(ios.launchApplication(iPhoneSim.udid, 'com.yourcompany.ernrunner'))
  } finally {
    shell.popd()
  }
}

async function buildIosRunner(pathToIosRunner: string, udid: string) {
  return new Promise((resolve, reject) => {
    const xcodebuildProc = spawn(
      'xcodebuild',
      [
        `-scheme`,
        'ErnRunner',
        'build',
        `-destination`,
        `id=${udid}`,
        `SYMROOT=${pathToIosRunner}/build`,
      ],
      { cwd: pathToIosRunner }
    )

    xcodebuildProc.stdout.on('data', data => {
      log.debug(data.toString())
    })
    xcodebuildProc.stderr.on('data', data => {
      log.debug(data.toString())
    })
    xcodebuildProc.on('close', code => {
      code === 0
        ? resolve()
        : reject(
            new Error(`XCode xcbuild command failed with exit code ${code}`)
          )
    })
  })
}

async function doesPackageExistInNpm(packageName: string): Promise<boolean> {
  try {
    const result = await yarn.info(PackagePath.fromString(packageName), {
      field: 'versions 2> /dev/null',
      json: true,
    })
    if (result && result.type === `inspect`) {
      return true
    }
  } catch (e) {
    // If the package name doesn't exist in the NPM registry, Do nothing
    // {"type":"error","data":"Received invalid response from npm."}
  }
  return false
}

async function performPkgNameConflictCheck(name: string): Promise<boolean> {
  // check if the packageName exists
  const isPackageNameInNpm = await doesPackageExistInNpm(name)
  if (isPackageNameInNpm) {
    const { continueIfPkgNameExists } = await inquirer.prompt([
      <inquirer.Question>{
        default: false,
        message: `The package with name ${name} is already published in NPM registry. Do you wish to continue?`,
        name: 'continueIfPkgNameExists',
        type: 'confirm',
      },
    ])
    return continueIfPkgNameExists
  }
  return true // If package name doesn't exist continue with command execution
}

function checkIfModuleNameContainsSuffix(
  moduleName: string,
  moduleType: string
): boolean {
  if (moduleName) {
    switch (moduleType) {
      case ModuleTypes.MINIAPP:
        return moduleName.toUpperCase().indexOf('MINIAPP') > -1
      case ModuleTypes.API:
        return moduleName.toUpperCase().indexOf('API') > -1
      case ModuleTypes.JS_API_IMPL:
        return moduleName.toUpperCase().indexOf('APIIMPLJS') > -1
      case ModuleTypes.NATIVE_API_IMPL:
        return moduleName.toUpperCase().indexOf('APIIMPLNATIVE') > -1
      default:
        return false
    }
  }
  return false
}

async function promptUserToUseSuffixModuleName(
  moduleName: string,
  moduleType: string
): Promise<string> {
  let message = ''
  let suffixedModuleName = moduleName
  if (moduleName) {
    switch (moduleType) {
      case ModuleTypes.MINIAPP:
        suffixedModuleName = `${moduleName}MiniApp`
        message = `We recommend suffixing the name of ${moduleName} with MiniApp, Do you want to use ${suffixedModuleName}?`
        break
      case ModuleTypes.API:
        suffixedModuleName = `${moduleName}Api`
        message = `We recommend suffixing the name of ${moduleName} with Api, Do you want to use ${suffixedModuleName}?`
        break
      case ModuleTypes.JS_API_IMPL:
        suffixedModuleName = `${moduleName}ApiImplJs`
        message = `We recommend suffixing the name of ${moduleName} with ApiImplJs, Do you want to use ${suffixedModuleName}?`
        break
      case ModuleTypes.NATIVE_API_IMPL:
        suffixedModuleName = `${moduleName}ApiImplNative`
        message = `We recommend suffixing the name of ${moduleName} with ApiImplNative, Do you want to use ${suffixedModuleName}?`
        break
      default:
        throw new Error(`Unsupported module type : ${moduleType}`)
    }
  }

  const { useSuffixedModuleName } = await inquirer.prompt(<inquirer.Question>{
    default: true,
    message,
    name: 'useSuffixedModuleName',
    type: 'confirm',
  })

  return useSuffixedModuleName ? suffixedModuleName : moduleName
}

async function getDescriptorsMatchingSemVerDescriptor(
  semVerDescriptor: NativeApplicationDescriptor
): Promise<NativeApplicationDescriptor[]> {
  if (!semVerDescriptor.platform || !semVerDescriptor.version) {
    throw new Error(
      `${semVerDescriptor.toString()} descriptor is missing platform and/or version`
    )
  }
  const result: NativeApplicationDescriptor[] = []
  const cauldron = await getActiveCauldron()
  const versionsNames = await cauldron.getVersionsNames(semVerDescriptor)
  const semVerVersionNames = normalizeVersionsToSemver(versionsNames)
  const zippedVersions = _.zipWith(
    versionsNames,
    semVerVersionNames,
    (nonSemVer, semVer) => ({ nonSemVer, semVer })
  )

  const versions = _.filter(zippedVersions, z =>
    semver.satisfies(z.semVer, <string>semVerDescriptor.version)
  )
  for (const version of versions) {
    const descriptor = new NativeApplicationDescriptor(
      semVerDescriptor.name,
      semVerDescriptor.platform,
      version.nonSemVer
    )
    result.push(descriptor)
  }

  return result
}

function normalizeVersionsToSemver(versions: string[]): string[] {
  const validSemVerRe = /^\d+\.\d+.\d+.*/
  const versionMissingPatchRe = /^(\d+\.\d+)(.*)/
  const versionMissingMinorRe = /^(\d+)(.*)/
  return _.map(versions, v => {
    if (validSemVerRe.test(v)) {
      return v
    } else {
      if (versionMissingPatchRe.test(v)) {
        return v.replace(versionMissingPatchRe, '$1.0$2')
      } else if (versionMissingMinorRe.test(v)) {
        return v.replace(versionMissingMinorRe, '$1.0.0$2')
      }
      throw new Error(`${v} is not a valid version`)
    }
  })
}

function logNativeDependenciesConflicts(
  nativeDependencies: any,
  {
    throwIfConflict,
  }: {
    throwIfConflict?: boolean
  } = {}
) {
  const conflictingDependencies =
    nativeDependencies.pluginsWithMismatchingVersions
  if (conflictingDependencies.length > 0) {
    if (!throwIfConflict) {
      log.warn(
        '============================================================================='
      )
      log.warn(
        'The following native dependencies are using different conflicting versions : '
      )
      conflictingDependencies.foreach(p => log.warn(`- ${p}`))
      log.warn('Ignoring due to the use of the --force flag')
      log.warn(
        '============================================================================='
      )
    } else {
      throw new Error(
        `Some native dependencies are using conflicting versions : ${conflictingDependencies.join(
          ','
        )}`
      )
    }
  }
}

async function unzip(zippedData: Buffer, destPath: string) {
  if (!fs.existsSync(destPath)) {
    shell.mkdir('-p', destPath)
  }
  return new Promise((resolve, reject) => {
    yauzl.fromBuffer(zippedData, { lazyEntries: true }, (err, zipfile) => {
      if (err) {
        reject(err)
      } else if (zipfile == null) {
        reject(new Error('zipFile is null or undefined'))
      } else {
        zipfile.readEntry()
        zipfile.on('end', () => resolve())
        zipfile.on('entry', entry => {
          if (/\$/.test(entry.fileName)) {
            // Current entry is an empty directory
            shell.mkdir('-p', path.join(destPath, entry.fileName))
            zipfile.readEntry()
          } else {
            // Current entry is a file
            shell.mkdir('-p', path.join(destPath, path.dirname(entry.fileName)))
            const ws = fs.createWriteStream(path.join(destPath, entry.fileName))
            zipfile.openReadStream(entry, (error, rs) => {
              if (error) {
                reject(error)
              } else if (rs == null) {
                reject(new Error('rs is null or undefined'))
              } else {
                rs.pipe(ws)
                rs.on('end', () => zipfile.readEntry())
              }
            })
          }
        })
      }
    })
  })
}

/**
 * Parse json from a string or a file and return the
 * resulting JavaScript object
 * @param s A json string or a local file path to a json file.
 * Can also be a reference to a file stored in cauldron, using
 * the cauldron:// file scheme.
 */
async function parseJsonFromStringOrFile(s: string): Promise<any> {
  let result
  try {
    if (s.startsWith(cauldronFileUriScheme)) {
      const cauldron = await getActiveCauldron()
      const file = await cauldron.getFile({
        cauldronFilePath: s,
      })
      result = JSON.parse(file.toString())
    } else if (fs.existsSync(s)) {
      result = await fileUtils.readJSON(s)
    } else {
      result = JSON.parse(s)
    }
  } catch (e) {
    throw new Error('[parseJsonFromStringOrFile] Invalid JSON or file')
  }
  return result
}

/**
 * Parse a yargs arg value to return its real representation
 * Yargs as it is configured will only detect args as number or string
 * types.
 * This function will return the real typed value as follow :
 * - If value is of type 'number' return the value as such
 * - If value is the string 'true' or 'false' return the boolean representation
 * - If value is a string indicating a path to a file, return parseJsonFromStringOrFile result
 * - If value is a string indication a path to a file in cauldron, return parseJsonFromStringOrFile result
 * - Otherwise just try to parse the string as json and return the object, or if it fails just return the original value
 * @param v The value to parse
 */
async function parseArgValue(v: number | string): Promise<any> {
  if (typeof v === 'number') {
    return v
  } else if (v.startsWith(cauldronFileUriScheme)) {
    return parseJsonFromStringOrFile(v)
  } else if (v === 'true') {
    return true
  } else if (v === 'false') {
    return false
  } else if (fs.existsSync(v)) {
    return parseJsonFromStringOrFile(v)
  } else {
    try {
      return JSON.parse(v)
    } catch (e) {
      return v
    }
  }
}

export default {
  askUserToChooseANapDescriptorFromCauldron,
  askUserToChooseOneOrMoreNapDescriptorFromCauldron,
  checkIfModuleNameContainsSuffix,
  createZippedBundle,
  doesPackageExistInNpm,
  epilog,
  getDefaultExtraConfigurationOfPublisherFromCauldron,
  getDescriptorsMatchingSemVerDescriptor,
  getNapDescriptorStringsFromCauldron,
  logErrorAndExitIfNotSatisfied,
  logNativeDependenciesConflicts,
  normalizeVersionsToSemver,
  parseArgValue,
  parseJsonFromStringOrFile,
  performContainerStateUpdateInCauldron,
  performPkgNameConflictCheck,
  promptUserToUseSuffixModuleName,
  runContainerPublishers,
  runContainerTransformers,
  runMiniApp,
  unzip,
}
