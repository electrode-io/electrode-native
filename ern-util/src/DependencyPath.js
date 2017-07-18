// @flow

export default class DependencyPath {
  path: string

  constructor (path: string) {
    this.path = path
  }

  static fromString (strPath: string) {
    return new DependencyPath(strPath)
  }

  static fromFileSystemPath (fsPath: string) {
    return new DependencyPath(`file:${fsPath}`)
  }

  get isAFileSystemPath () : boolean {
    return /^file:/.test(this.path)
  }

  get isAGitPath () : boolean {
    return /^git/.test(this.path)
  }

  toString () : string {
    return this.path
  }
}
