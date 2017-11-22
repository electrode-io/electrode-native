// @flow

import {
  Dependency,
  DependencyPath,
  NativeApplicationDescriptor
} from 'ern-util'
import {
  cauldron,
  dependencyLookup,
  utils
} from 'ern-core'
import _ from 'lodash'
import semver from 'semver'
import validateNpmPackageName from 'validate-npm-package-name'

export default class Ensure {
  static isValidElectrodeNativeModuleName (
    name: string,
    extraErrorMessage: string = '') {
    if (!utils.isValidElectrodeNativeModuleName(name)) {
      const errorMessage = `${name} is not a valid Electrode Native module name\n${extraErrorMessage}`
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
    const cauldronContainerVersion = await cauldron.getTopLevelContainerVersion(NativeApplicationDescriptor.fromString(napDescriptor))
    if (!semver.gt(containerVersion, cauldronContainerVersion)) {
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
      const dependencyPath = DependencyPath.fromString(path)
      if (dependencyPath.isAFileSystemPath || dependencyPath.isAGitPath) {
        throw new Error(`Found a git or file system path.\n${extraErrorMessage}`)
      }
    }
  }

  static noFileSystemPath (
    obj: string | Array<string>,
    extraErrorMessage: string = '') {
    const paths = obj instanceof Array ? obj : [ obj ]
    for (const path of paths) {
      const dependencyPath = DependencyPath.fromString(path)
      if (dependencyPath.isAFileSystemPath) {
        throw new Error(`Found a file system path.\n${extraErrorMessage}`)
      }
    }
  }

  static async napDescritorExistsInCauldron (
    napDescriptor: string | Array<string>,
    extraErrorMessage: string = '') {
    const descriptors = napDescriptor instanceof Array
      ? _.map(napDescriptor, d => NativeApplicationDescriptor.fromString(d))
      : [ NativeApplicationDescriptor.fromString(napDescriptor) ]
    for (const descriptor of descriptors) {
      const result = await cauldron.getNativeApp(descriptor)
      if (!result) {
        throw new Error(`${descriptor.toString()} descriptor does not exist in Cauldron.\n${extraErrorMessage}`)
      }
    }
  }

  static sameNativeApplicationAndPlatform (
    descriptors: Array<string>,
    extraErrorMessage: string = '') {
    const versionLessDescriptors = _.map(descriptors, n => `${n.split(':')[0]}:${n.split(':')[1]}`)
    if (_.uniq(versionLessDescriptors).length > 1) {
      throw new Error(`Descriptors do not all matchthe same native application/platform.\n${extraErrorMessage}`)
    }
  }

  static async napDescritorDoesNotExistsInCauldron (
    napDescriptor: string,
    extraErrorMessage: string = '') {
    const descriptor = NativeApplicationDescriptor.fromString(napDescriptor)
    const result = await cauldron.getNativeApp(descriptor)
    if (result) {
      throw new Error(`${descriptor.toString()} descriptor exist in Cauldron.\n${extraErrorMessage}`)
    }
  }

  static async publishedToNpm (
    obj: string | Array<string>,
    extraErrorMessage: string = '') {
    const dependencies = obj instanceof Array ? obj : [ obj ]
    for (const dependency of dependencies) {
      if (!await utils.isPublishedToNpm(dependency)) {
        throw new Error(`${dependency} version is not published to NPM.\n${extraErrorMessage}`)
      }
    }
  }

  static async miniAppNotInNativeApplicationVersionContainer (
    obj: string | Array<string> | void,
    napDescriptor: NativeApplicationDescriptor,
    extraErrorMessage: string = '') {
    if (!obj) return
    const miniAppsStrings = obj instanceof Array ? obj : [ obj ]
    for (const miniAppString of miniAppsStrings) {
      const versionLessMiniAppString = Dependency.fromString(miniAppString).withoutVersion().toString()
      if (await cauldron.getContainerMiniApp(napDescriptor, versionLessMiniAppString)) {
        throw new Error(`${versionLessMiniAppString} MiniApp exists in ${napDescriptor.toString()}.\n${extraErrorMessage}`)
      }
    }
  }

  static async dependencyNotInNativeApplicationVersionContainer (
    obj: string | Array<string> | void,
    napDescriptor: NativeApplicationDescriptor,
    extraErrorMessage: string = '') {
    if (!obj) return
    const dependenciesStrings = obj instanceof Array ? obj : [ obj ]
    for (const dependencyString of dependenciesStrings) {
      const unversionedDependencyString = Dependency.fromString(dependencyString).withoutVersion().toString()
      if (await cauldron.getNativeDependency(napDescriptor, unversionedDependencyString)) {
        throw new Error(`${unversionedDependencyString} dependency exists in ${napDescriptor.toString()}.\n${extraErrorMessage}`)
      }
    }
  }

  static async miniAppIsInNativeApplicationVersionContainer (
    obj: string | Array<string> | void,
    napDescriptor: NativeApplicationDescriptor,
    extraErrorMessage: string = '') {
    if (!obj) return
    const miniAppsStrings = obj instanceof Array ? obj : [ obj ]
    for (const miniAppString of miniAppsStrings) {
      const versionLessMiniAppString = Dependency.fromString(miniAppString).withoutVersion().toString()
      if (!await cauldron.getContainerMiniApp(napDescriptor, versionLessMiniAppString)) {
        throw new Error(`${versionLessMiniAppString} MiniApp does not exist in ${napDescriptor.toString()}.\n${extraErrorMessage}`)
      }
    }
  }

  static async dependencyIsInNativeApplicationVersionContainer (
    obj: string | Array<string> | void,
    napDescriptor: NativeApplicationDescriptor,
    extraErrorMessage: string = '') {
    if (!obj) return
    const dependenciesStrings = obj instanceof Array ? obj : [ obj ]
    for (const dependencyString of dependenciesStrings) {
      const unversionedDependencyString = Dependency.fromString(dependencyString).withoutVersion().toString()
      if (!await cauldron.getNativeDependency(napDescriptor, unversionedDependencyString)) {
        throw new Error(`${unversionedDependencyString} does not exists in ${napDescriptor.toString()}.\n${extraErrorMessage}`)
      }
    }
  }

  static async miniAppIsInNativeApplicationVersionContainerWithDifferentVersion (
    obj: string | Array<string> | void,
    napDescriptor: NativeApplicationDescriptor,
    extraErrorMessage: string = '') {
    if (!obj) return
    const miniAppsStrings = obj instanceof Array ? obj : [ obj ]
    const versionLessMiniAppsStrings = _.map(miniAppsStrings, m => Dependency.fromString(m).withoutVersion().toString())
    await this.miniAppIsInNativeApplicationVersionContainer(versionLessMiniAppsStrings, napDescriptor)
    for (const miniAppString of miniAppsStrings) {
      const miniAppFromCauldron = await cauldron.getContainerMiniApp(napDescriptor, miniAppString)
      const cauldronMiniApp = Dependency.fromString(miniAppFromCauldron)
      const givenMiniApp = Dependency.fromString(miniAppString)
      if (cauldronMiniApp.version === givenMiniApp.version) {
        throw new Error(`${cauldronMiniApp.withoutVersion().toString()} is already at version ${givenMiniApp.version} in ${napDescriptor.toString()}.\n${extraErrorMessage}`)
      }
    }
  }

  static async dependencyIsInNativeApplicationVersionContainerWithDifferentVersion (
    obj: string | Array<string> | void,
    napDescriptor: NativeApplicationDescriptor,
    extraErrorMessage: string = '') {
    if (!obj) return
    await this.dependencyIsInNativeApplicationVersionContainer(obj, napDescriptor)
    const dependenciesStrings = obj instanceof Array ? obj : [ obj ]
    for (const dependencyString of dependenciesStrings) {
      const dependencyFromCauldron = await cauldron.getNativeDependency(napDescriptor,
        Dependency.fromString(dependencyString).withoutVersion().toString())
      if (dependencyFromCauldron && dependencyFromCauldron.version === Dependency.fromString(dependencyString).version) {
        throw new Error(`${Dependency.fromString(dependencyString).withoutVersion().toString()} is already at version ${dependencyFromCauldron.version} in ${napDescriptor.toString()}.\n${extraErrorMessage}`)
      }
    }
  }

  static async dependencyNotInUseByAMiniApp (
    obj: string | Array<string> | void,
    napDescriptor: NativeApplicationDescriptor,
    extraErrorMessage: string = '') {
    if (!obj) return
    const dependencies = obj instanceof Array ? obj : [ obj ]
    const dependenciesObjs = _.map(dependencies, d => Dependency.fromString(d))

    // First let's figure out if any of the MiniApps are using this/these dependency(ies)
    // to make sure that we don't remove any dependency currently used by any MiniApp
    const miniApps = await cauldron.getContainerMiniApps(napDescriptor)
    const miniAppsPaths = _.map(miniApps, m => m.path)

    for (const dependencyObj of dependenciesObjs) {
      const miniAppsUsingDependency = await dependencyLookup.getMiniAppsUsingNativeDependency(miniAppsPaths, dependencyObj)
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

  static cauldronIsActive (extraErrorMessage: string = '') {
    if (!cauldron.isActive()) {
      throw new Error(`There is no active Cauldron\n${extraErrorMessage}`)
    }
  }
}
