// @flow

import {
  Dependency,
  DependencyPath,
  NativeApplicationDescriptor
} from 'ern-util'
import {
  cauldron,
  utils
} from 'ern-core'
import _ from 'lodash'

export default class Ensure {
  static isValidContainerVersion (version: string) {
    if (/^\d+.\d+.\d+$/.test(version) === false) {
      throw new Error(`Invalid container version (${version}). Please use a valid version in the form x.y.z`)
    }
  }

  static isCompleteNapDescriptorString (str: string) {
    if (NativeApplicationDescriptor.fromString(str).isPartial) {
      throw new Error(`Please use a complete native application descriptor in the form name:platform:version`)
    }
  }

  static noGitOrFilesystemPath (obj: string | Array<string> | void) {
    if (!obj) return
    const paths = obj instanceof Array ? obj : [ obj ]
    for (const path of paths) {
      const dependencyPath = DependencyPath.fromString(path)
      if (dependencyPath.isAFileSystemPath || dependencyPath.isAGitPath) {
        throw new Error(`You cannot use git or file system paths`)
      }
    }
  }

  static async napDescritorExistsInCauldron (napDescriptor: string) {
    const descriptor = NativeApplicationDescriptor.fromString(napDescriptor)
    const result = await cauldron.getNativeApp(descriptor)
    if (!result) {
      throw new Error(`${descriptor.toString()} descriptor does not exist in Cauldron`)
    }
  }

  static async publishedToNpm (obj: string | Array<string>) {
    const dependencies = obj instanceof Array ? obj : [ obj ]
    for (const dependency of dependencies) {
      if (!await utils.isPublishedToNpm(dependency)) {
        throw new Error(`${dependency} version is not published to NPM`)
      }
    }
  }

  static async miniAppNotInNativeApplicationVersionContainer (
    obj: string | Array<string> | void,
    napDescriptor: NativeApplicationDescriptor) {
    if (!obj) return
    const miniAppsStrings = obj instanceof Array ? obj : [ obj ]
    for (const miniAppString of miniAppsStrings) {
      if (await cauldron.getContainerMiniApp(napDescriptor, miniAppString)) {
        throw new Error(`${miniAppString} exists in ${napDescriptor.toString()}`)
      }
    }
  }

  static async miniAppIsInNativeApplicationVersionContainer (
    obj: string | Array<string> | void,
    napDescriptor: NativeApplicationDescriptor) {
    if (!obj) return
    const miniAppsStrings = obj instanceof Array ? obj : [ obj ]
    for (const miniAppString of miniAppsStrings) {
      if (!await cauldron.getContainerMiniApp(napDescriptor, miniAppString)) {
        throw new Error(`${miniAppString} does not exist in ${napDescriptor.toString()}`)
      }
    }
  }

  static async miniAppIsInNativeApplicationVersionContainerWithDifferentVersion (
    obj: string | Array<string> | void,
    napDescriptor: NativeApplicationDescriptor) {
    if (!obj) return
    const miniAppsStrings = obj instanceof Array ? obj : [ obj ]
    const versionLessMiniAppsStrings = _.map(miniAppsStrings, m => Dependency.fromString(m).withoutVersion().toString())
    await this.miniAppIsInNativeApplicationVersionContainer(versionLessMiniAppsStrings, napDescriptor)
    for (const miniAppString of miniAppsStrings) {
      const miniAppFromCauldron = await cauldron.getContainerMiniApp(napDescriptor, miniAppString)
      const cauldronMiniApp = Dependency.fromString(miniAppFromCauldron)
      const givenMiniApp = Dependency.fromString(miniAppString)
      if (cauldronMiniApp.version === givenMiniApp.version) {
        throw new Error(`${cauldronMiniApp.withoutVersion().toString()} is already at version ${givenMiniApp.version} in ${napDescriptor.toString()}`)
      }
    }
  }
}
