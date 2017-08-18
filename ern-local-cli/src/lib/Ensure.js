// @flow

import {
  NativeApplicationDescriptor
} from 'ern-util'

export default class Ensure {
  static isValidContainerVersion (version: string) {
    if (/^\d+.\d+.\d+$/.test(version) === false) {
      throw new Error(`Invalid version (${version}) for container. Please use a valid version in the form x.y.z`)
    }
  }

  static isCompleteNapDescriptorString (str: string) {
    if (NativeApplicationDescriptor.fromString(str).isPartial) {
      throw new Error(`Native application descriptor is not a complete one. Please use a valid descriptor in the form name:platform:version`)
    }
  }
}
