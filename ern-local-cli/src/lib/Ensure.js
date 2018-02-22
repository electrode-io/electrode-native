// @flow

import {
  PackagePath,
  NativeApplicationDescriptor,
  utils as coreUtils,
  dependencyLookup
} from 'ern-core'
import _ from 'lodash'
import semver from 'semver'
import validateNpmPackageName from 'validate-npm-package-name'

export default class Ensure {
  static isValidElectrodeNativeModuleName (
    name: string,
    extraErrorMessage: string = '') {
    if (!coreUtils.isValidElectrodeNativeModuleName(name)) {
      const errorMessage = `${name} is not a valid Electrode Native module name\nCheck GLOSSARY section of doc for "Electrode Native module name" naming rules\n${extraErrorMessage}`
      throw new Error(errorMessage)
    }
  }

  static isValidNpmPackageName (
    name: string,
    extraErrorMessage: string = '') {
    const validation = validateNpmPackageName(name)
    if (!validation.validForNewPackages) {
      const errorMessage =
        `${name} is not a valid NPM package name\n`
          .concat(validation.errors ? validation.errors.join('\n') : '')
          .concat(`\n${extraErrorMessage}`)
      throw new Error(errorMessage)
    }
  }

  static isValidContainerVersion (
    version: string,
    extraErrorMessage: string = '') {
    if (/^\d+.\d+.\d+$/.test(version) === false) {
      throw new Error(`${version} is not a valid container version.\n${extraErrorMessage}`)
    }
  }

  static async isNewerContainerVersion (
    napDescriptor: string,
    containerVersion: string,
    extraErrorMessage: string = '') {
    const cauldron = await coreUtils.getCauldronInstance()
    const cauldronContainerVersion = await cauldron.getTopLevelContainerVersion(NativeApplicationDescriptor.fromString(napDescriptor))
    if (cauldronContainerVersion && !semver.gt(containerVersion, cauldronContainerVersion)) {
      throw new Error(`Container version ${containerVersion} is older than ${cauldronContainerVersion}\n${extraErrorMessage}`)
    }
  }

  static isCompleteNapDescriptorString (
    str: string,
    extraErrorMessage: string = '') {
    if (NativeApplicationDescriptor.fromString(str).isPartial) {
      throw new Error(`${str} is not a complete native application descriptor, in the form application:platform:version\n${extraErrorMessage}`)
    }
  }

  static noGitOrFilesystemPath (
    obj: string | Array<string> | void,
    extraErrorMessage: string = '') {
    if (!obj) return
    const paths = obj instanceof Array ? obj : [ obj ]
    for (const path of paths) {
      const dependencyPath = PackagePath.fromString(path)
      if (dependencyPath.isFilePath || dependencyPath.isGitPath) {
        throw new Error(`Found a git or file system path.\n${extraErrorMessage}`)
      }
    }
  }

  static noFileSystemPath (
    obj: string | Array<string>,
    extraErrorMessage: string = '') {
    const paths = obj instanceof Array ? obj : [ obj ]
    for (const path of paths) {
      const dependencyPath = PackagePath.fromString(path)
      if (dependencyPath.isFilePath) {
        throw new Error(`Found a file system path.\n${extraErrorMessage}`)
      }
    }
  }

  static async napDescritorExistsInCauldron (
    napDescriptor: string | Array<string>,
    extraErrorMessage: string = '') {
    const cauldron = await coreUtils.getCauldronInstance()
    const descriptors = napDescriptor instanceof Array
      ? _.map(napDescriptor, d => NativeApplicationDescriptor.fromString(d))
      : [ NativeApplicationDescriptor.fromString(napDescriptor) ]
    for (const descriptor of descriptors) {
      const result = await cauldron.isDescriptorInCauldron(descriptor)
      if (!result) {
        throw new Error(`${descriptor.toString()} descriptor does not exist in Cauldron.\n${extraErrorMessage}`)
      }
    }
  }

  static sameNativeApplicationAndPlatform (
    descriptors: Array<string>,
    extraErrorMessage: string = '') {
    const basePathDescriptors = _.map(descriptors, n => `${n.split(':')[0]}:${n.split(':')[1]}`)
    if (_.uniq(basePathDescriptors).length > 1) {
      throw new Error(`Descriptors do not all matchthe same native application/platform.\n${extraErrorMessage}`)
    }
  }

  static async napDescritorDoesNotExistsInCauldron (
    napDescriptor: string,
    extraErrorMessage: string = '') {
    const cauldron = await coreUtils.getCauldronInstance()
    const descriptor = NativeApplicationDescriptor.fromString(napDescriptor)
    if (await cauldron.isDescriptorInCauldron(descriptor)) {
      throw new Error(`${descriptor.toString()} descriptor exist in Cauldron.\n${extraErrorMessage}`)
    }
  }

  static async publishedToNpm (
    obj: string | Array<string>,
    extraErrorMessage: string = '') {
    const dependencies = obj instanceof Array ? obj : [ obj ]
    for (const dependency of dependencies) {
      if (!await coreUtils.isPublishedToNpm(dependency)) {
        throw new Error(`${dependency} version is not published to NPM.\n${extraErrorMessage}`)
      }
    }
  }

  static async miniAppNotInNativeApplicationVersionContainer (
    obj: string | Array<string> | void,
    napDescriptor: NativeApplicationDescriptor,
    extraErrorMessage: string = '') {
    if (!obj) return
    const cauldron = await coreUtils.getCauldronInstance()
    const miniAppsStrings = obj instanceof Array ? obj : [ obj ]
    for (const miniAppString of miniAppsStrings) {
      const basePathMiniAppString = PackagePath.fromString(miniAppString).basePath
      if (await cauldron.isMiniAppInContainer(napDescriptor, basePathMiniAppString)) {
        throw new Error(`${basePathMiniAppString} MiniApp exists in ${napDescriptor.toString()}.\n${extraErrorMessage}`)
      }
    }
  }

  static async dependencyNotInNativeApplicationVersionContainer (
    obj: string | Array<string> | void,
    napDescriptor: NativeApplicationDescriptor,
    extraErrorMessage: string = '') {
    if (!obj) return
    const cauldron = await coreUtils.getCauldronInstance()
    const dependenciesStrings = obj instanceof Array ? obj : [ obj ]
    for (const dependencyString of dependenciesStrings) {
      const unversionedDependencyString = PackagePath.fromString(dependencyString).basePath
      if (await cauldron.isNativeDependencyInContainer(napDescriptor, unversionedDependencyString)) {
        throw new Error(`${unversionedDependencyString} dependency exists in ${napDescriptor.toString()}.\n${extraErrorMessage}`)
      }
    }
  }

  static async miniAppIsInNativeApplicationVersionContainer (
    obj: string | Array<string> | void,
    napDescriptor: NativeApplicationDescriptor,
    extraErrorMessage: string = '') {
    if (!obj) return
    const cauldron = await coreUtils.getCauldronInstance()
    const miniAppsStrings = obj instanceof Array ? obj : [ obj ]
    for (const miniAppString of miniAppsStrings) {
      const basePathMiniAppString = PackagePath.fromString(miniAppString).basePath
      if (!await cauldron.isMiniAppInContainer(napDescriptor, basePathMiniAppString)) {
        throw new Error(`${basePathMiniAppString} MiniApp does not exist in ${napDescriptor.toString()}.\n${extraErrorMessage}`)
      }
    }
  }

  static async dependencyIsInNativeApplicationVersionContainer (
    obj: string | Array<string> | void,
    napDescriptor: NativeApplicationDescriptor,
    extraErrorMessage: string = '') {
    if (!obj) return
    const cauldron = await coreUtils.getCauldronInstance()
    const dependenciesStrings = obj instanceof Array ? obj : [ obj ]
    for (const dependencyString of dependenciesStrings) {
      const unversionedDependencyString = PackagePath.fromString(dependencyString).basePath
      if (!await cauldron.getContainerNativeDependency(napDescriptor, unversionedDependencyString)) {
        throw new Error(`${unversionedDependencyString} does not exists in ${napDescriptor.toString()}.\n${extraErrorMessage}`)
      }
    }
  }

  static async miniAppIsInNativeApplicationVersionContainerWithDifferentVersion (
    obj: string | Array<string> | void,
    napDescriptor: NativeApplicationDescriptor,
    extraErrorMessage: string = '') {
    if (!obj) return
    const cauldron = await coreUtils.getCauldronInstance()
    const miniAppsStrings = obj instanceof Array ? obj : [ obj ]
    const basePathMiniAppsStrings = _.map(miniAppsStrings, m => PackagePath.fromString(m).basePath)
    await this.miniAppIsInNativeApplicationVersionContainer(basePathMiniAppsStrings, napDescriptor)
    for (const miniAppString of miniAppsStrings) {
      const miniAppFromCauldron = await cauldron.getContainerMiniApp(napDescriptor, PackagePath.fromString(miniAppString).basePath)
      const cauldronMiniApp = PackagePath.fromString(miniAppFromCauldron)
      const givenMiniApp = PackagePath.fromString(miniAppString)
      if (cauldronMiniApp.version === givenMiniApp.version) {
        throw new Error(`${cauldronMiniApp.basePath} is already at version ${givenMiniApp.version || ''} in ${napDescriptor.toString()}.\n${extraErrorMessage}`)
      }
    }
  }

  static async dependencyIsInNativeApplicationVersionContainerWithDifferentVersion (
    obj: string | Array<string> | void,
    napDescriptor: NativeApplicationDescriptor,
    extraErrorMessage: string = '') {
    if (!obj) return
    const cauldron = await coreUtils.getCauldronInstance()
    await this.dependencyIsInNativeApplicationVersionContainer(obj, napDescriptor)
    const dependenciesStrings = obj instanceof Array ? obj : [ obj ]
    for (const dependencyString of dependenciesStrings) {
      const dependencyFromCauldron = await cauldron.getContainerNativeDependency(napDescriptor,
        PackagePath.fromString(dependencyString).basePath)
      if (dependencyFromCauldron && dependencyFromCauldron.version === PackagePath.fromString(dependencyString).version) {
        throw new Error(`${PackagePath.fromString(dependencyString).basePath} is already at version ${dependencyFromCauldron.version || 'undefined'} in ${napDescriptor.toString()}.\n${extraErrorMessage}`)
      }
    }
  }

  static async dependencyNotInUseByAMiniApp (
    obj: string | Array<string> | void,
    napDescriptor: NativeApplicationDescriptor,
    extraErrorMessage: string = '') {
    if (!obj) return
    const cauldron = await coreUtils.getCauldronInstance()
    const dependencies = obj instanceof Array ? obj : [ obj ]
    const dependenciesObjs = _.map(dependencies, d => PackagePath.fromString(d))

    // First let's figure out if any of the MiniApps are using this/these dependency(ies)
    // to make sure that we don't remove any dependency currently used by any MiniApp
    const miniApps = await cauldron.getContainerMiniApps(napDescriptor)

    for (const dependencyObj of dependenciesObjs) {
      const miniAppsUsingDependency = await dependencyLookup.getMiniAppsUsingNativeDependency(miniApps, dependencyObj)
      if (miniAppsUsingDependency && miniAppsUsingDependency.length > 0) {
        let errorMessage = ''
        errorMessage += 'The following MiniApp(s) are using this dependency\n'
        for (const miniApp of miniAppsUsingDependency) {
          errorMessage += `=> ${miniApp.name}\n`
        }
        errorMessage += 'You cannot remove a native dependency that is being used by at least a MiniApp\n'
        errorMessage += 'To properly remove this native dependency, you cant either :\n'
        errorMessage += '- Remove the native dependency from the MiniApp(s) that are using it\n'
        errorMessage += '- Remove the MiniApps that are using this dependency\n'
        errorMessage += '- Provide the force flag to this command (if you really now what you are doing !)'
        throw new Error(errorMessage)
      }
    }
  }

  static async cauldronIsActive (extraErrorMessage: string = '') {
    if (!await coreUtils.getCauldronInstance()) {
      throw new Error(`There is no active Cauldron\n${extraErrorMessage}`)
    }
  }
}
