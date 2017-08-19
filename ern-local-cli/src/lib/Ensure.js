// @flow

import {
  DependencyPath,
  NativeApplicationDescriptor
} from 'ern-util'

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
}
