// @flow

export default class DependencyPath {
  path: string

  constructor (path: string) {
    this.path = path
  }

  get isFilePath () : boolean {
    return /^file:/.test(this.path)
  }

  get isGitPath () : boolean {
    return /^git/.test(this.path)
  }
}
