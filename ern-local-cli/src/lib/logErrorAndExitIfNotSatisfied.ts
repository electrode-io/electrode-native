import {
  kax,
  PackagePath,
  utils,
  AppVersionDescriptor,
  AnyAppDescriptor,
} from 'ern-core'
import { Ensure } from 'ern-orchestrator'
import fs from 'fs'

export async function logErrorAndExitIfNotSatisfied({
  noGitOrFilesystemPath,
  noFileSystemPath,
  isValidContainerVersion,
  isNewerContainerVersion,
  napDescriptorExistInCauldron,
  sameNativeApplicationAndPlatform,
  napDescritorDoesNotExistsInCauldron,
  publishedToNpm,
  miniAppNotInNativeApplicationVersionContainer,
  miniAppIsInNativeApplicationVersionContainer,
  miniAppIsInNativeApplicationVersionContainerWithDifferentVersion,
  dependencyNotInNativeApplicationVersionContainer,
  dependencyIsOrphaned,
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
  isSupportedMiniAppOrJsApiImplVersion,
  isContainerPath,
  isEnvVariableDefined,
  manifestIdExists,
  bundleStoreUrlSetInCauldron,
  bundleStoreAccessKeyIsSet,
  metroServerIsNotRunning,
}: {
  noGitOrFilesystemPath?: {
    obj: string | PackagePath | Array<string | PackagePath> | void
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
    descriptor: string | AppVersionDescriptor
    containerVersion: string
    extraErrorMessage?: string
  }
  napDescriptorExistInCauldron?: {
    descriptor: string | AnyAppDescriptor | Array<string | AnyAppDescriptor>
    extraErrorMessage?: string
  }
  sameNativeApplicationAndPlatform?: {
    descriptors: Array<string | AppVersionDescriptor>
    extraErrorMessage?: string
  }
  napDescritorDoesNotExistsInCauldron?: {
    descriptor: string | AnyAppDescriptor
    extraErrorMessage?: string
  }
  publishedToNpm?: {
    obj: string | PackagePath[] | Array<string | PackagePath>
    extraErrorMessage?: string
  }
  miniAppNotInNativeApplicationVersionContainer?: {
    miniApp: string | PackagePath | Array<string | PackagePath> | void
    descriptor: AppVersionDescriptor
    extraErrorMessage?: string
  }
  miniAppIsInNativeApplicationVersionContainer?: {
    miniApp: string | PackagePath[] | Array<string | PackagePath> | void
    descriptor: AppVersionDescriptor
    extraErrorMessage?: string
  }
  miniAppIsInNativeApplicationVersionContainerWithDifferentVersion?: {
    miniApp: string | PackagePath[] | Array<string | PackagePath> | void
    descriptor: AppVersionDescriptor
    extraErrorMessage?: string
  }
  dependencyNotInNativeApplicationVersionContainer?: {
    dependency: string | PackagePath[] | Array<string | PackagePath> | void
    descriptor: AppVersionDescriptor
    extraErrorMessage?: string
  }
  dependencyIsOrphaned?: {
    dependency: string | PackagePath[] | Array<string | PackagePath> | void
    descriptor: AppVersionDescriptor
    extraErrorMessage?: string
  }
  dependencyIsInNativeApplicationVersionContainer?: {
    dependency: string | PackagePath[] | Array<string | PackagePath> | void
    descriptor: AppVersionDescriptor
    extraErrorMessage?: string
  }
  dependencyIsInNativeApplicationVersionContainerWithDifferentVersion?: {
    dependency: string | PackagePath[] | Array<string | PackagePath> | void
    descriptor: AppVersionDescriptor
    extraErrorMessage?: string
  }
  dependencyNotInUseByAMiniApp?: {
    dependency: string | PackagePath | Array<string | PackagePath> | void
    descriptor: AppVersionDescriptor
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
    descriptors?: Array<string | AppVersionDescriptor>
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
  isSupportedMiniAppOrJsApiImplVersion?: {
    obj: string | PackagePath | Array<string | PackagePath> | void
  }
  isContainerPath?: {
    p: string
    extraErrorMessage?: string
  }
  isEnvVariableDefined?: {
    name: string
    extraErrorMessage?: string
  }
  manifestIdExists?: {
    id: string
    extraErrorMessage?: string
  }
  bundleStoreUrlSetInCauldron?: {
    extraErrorMessage?: string
  }
  bundleStoreAccessKeyIsSet?: {
    extraErrorMessage?: string
  }
  metroServerIsNotRunning?: {
    host: string
    port: string
    extraErrorMessage?: string
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
        miniAppNotInNativeApplicationVersionContainer.descriptor,
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
        miniAppIsInNativeApplicationVersionContainer.descriptor,
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
        miniAppIsInNativeApplicationVersionContainerWithDifferentVersion.descriptor,
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
        dependencyNotInNativeApplicationVersionContainer.descriptor,
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
        dependencyIsInNativeApplicationVersionContainer.descriptor,
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
        dependencyIsInNativeApplicationVersionContainerWithDifferentVersion.descriptor,
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
        dependencyNotInUseByAMiniApp.descriptor,
        dependencyNotInUseByAMiniApp.extraErrorMessage
      )
      kaxTask.succeed()
    }
    if (dependencyIsOrphaned) {
      kaxTask = kax.task('Ensuring that depedency/dependencies is/are orphaned')
      await Ensure.dependencyIsOrphaned(
        dependencyIsOrphaned.dependency,
        dependencyIsOrphaned.descriptor,
        dependencyIsOrphaned.extraErrorMessage
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
      await Ensure.isFilePath(isFilePath.p, isFilePath.extraErrorMessage)
      kaxTask.succeed()
    }
    if (isDirectoryPath) {
      kaxTask = kax.task('Ensuring that path is a directory path')
      await Ensure.isDirectoryPath(
        isDirectoryPath.p,
        isDirectoryPath.extraErrorMessage
      )
      kaxTask.succeed()
    }
    if (isValidPlatformConfig) {
      kaxTask = kax.task('Ensuring that config key is whitelisted')
      Ensure.isValidPlatformConfig(isValidPlatformConfig.key)
      kaxTask.succeed()
    }
    if (isSupportedMiniAppOrJsApiImplVersion) {
      kaxTask = kax.task('Ensuring that version is fixed')
      Ensure.isSupportedMiniAppOrJsApiImplVersion(
        isSupportedMiniAppOrJsApiImplVersion.obj
      )
      kaxTask.succeed()
    }
    if (isContainerPath) {
      kaxTask = kax.task('Ensuring that path is a container path')
      Ensure.isContainerPath(
        isContainerPath.p,
        isContainerPath.extraErrorMessage
      )
      kaxTask.succeed()
    }
    if (isEnvVariableDefined) {
      kaxTask = kax.task(
        `Ensuring that ${isEnvVariableDefined.name} env variable is defined`
      )
      Ensure.isEnvVariableDefined(
        isEnvVariableDefined.name,
        isEnvVariableDefined.extraErrorMessage
      )
      kaxTask.succeed()
    }
    if (manifestIdExists) {
      kaxTask = kax.task(
        `Ensuring that ${manifestIdExists.id} id exists in Manifest(s)`
      )
      await Ensure.manifestIdExists(
        manifestIdExists.id,
        manifestIdExists.extraErrorMessage
      )
      kaxTask.succeed()
    }
    if (bundleStoreUrlSetInCauldron) {
      kaxTask = kax.task(`Ensuring that bundleStore url is set in Cauldron`)
      await Ensure.bundleStoreUrlSetInCauldron(
        bundleStoreUrlSetInCauldron.extraErrorMessage
      )
      kaxTask.succeed()
    }
    if (bundleStoreAccessKeyIsSet) {
      kaxTask = kax.task(
        `Ensuring that bundlestore-accesskey is set in configuration`
      )
      await Ensure.bundleStoreAccessKeyIsSet(
        bundleStoreAccessKeyIsSet.extraErrorMessage
      )
      kaxTask.succeed()
    }
    if (metroServerIsNotRunning) {
      kaxTask = kax.task(`Ensuring that metro server is not running`)
      await Ensure.metroServerIsNotRunning(
        metroServerIsNotRunning.host,
        metroServerIsNotRunning.port,
        metroServerIsNotRunning.extraErrorMessage
      )
      kaxTask.succeed()
    }
  } catch (e) {
    kaxTask.fail()
    utils.logErrorAndExitProcess(e, 1)
  }
}
