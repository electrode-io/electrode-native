// @flow

export default class Ensure {
  static isValidContainerVersion (version: string) {
    if (/^\d+.\d+.\d+$/.test(version) === false) {
      throw new Error(`Invalid version (${version}) for container. Please use a valid version in the form x.y.z`)
    }
  }
}
