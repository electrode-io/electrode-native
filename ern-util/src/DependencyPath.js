// @flow

const FILE_PATH_RE = /^file:(.+)/
const GIT_PATH_RE = /^git:(.+)/

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
    return FILE_PATH_RE.test(this.path)
  }

  get isAGitPath () : boolean {
    return GIT_PATH_RE.test(this.path)
  }

  get unprefixedPath () : string {
    let result = this.path
    if (this.isAFileSystemPath) {
      result = FILE_PATH_RE.exec(this.path)[1]
    } else if (this.isAGitPath) {
      result = GIT_PATH_RE.exec(this.path)[1]
    }
    return result
  }

  toString () : string {
    return this.path
  }
}
