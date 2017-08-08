// @flow

import DependencyPath from './DependencyPath'

const SCOPE_NAME_VERSION_RE = /@(.+)\/(.*)@(.*)/
const SCOPE_NAME_NO_VERSION_RE = /@(.+)\/(.+)/
const NAME_VERSION_RE = /(.*)@(.*)/

export default class Dependency {
  name: string
  scope: string
  version: string

  constructor (name: string, { scope, version }: Object = {}) {
    this.name = name
    this.scope = scope
    this.version = version
  }

  static fromString (str: string) : Dependency {
    if (SCOPE_NAME_VERSION_RE.test(str)) {
      const scopeNameVersion = SCOPE_NAME_VERSION_RE.exec(str)
      return new Dependency(scopeNameVersion[2], {
        scope: scopeNameVersion[1],
        version: scopeNameVersion[3]
      })
    } else if (SCOPE_NAME_NO_VERSION_RE.test(str)) {
      const scopeName = SCOPE_NAME_NO_VERSION_RE.exec(str)
      return new Dependency(scopeName[2], {
        scope: scopeName[1]
      })
    } else if (NAME_VERSION_RE.test(str)) {
      const nameVersion = NAME_VERSION_RE.exec(str)
      return new Dependency(nameVersion[1], {
        version: nameVersion[2]
      })
    } else {
      return new Dependency(str)
    }
  }

  static fromPath (path: DependencyPath) : Dependency {
    if (path.isAFileSystemPath || path.isAGitPath) {
      throw new Error('fromPath. File path or Git Path not yet supported')
    }
    return Dependency.fromString(path.toString())
  }

  static same (depA: Dependency, depB: Dependency, {
    ignoreVersion = false
  } : {
    ignoreVersion?: boolean
  } = {}) : boolean {
    return (depA.name === depB.name) &&
        (depA.scope === depB.scope) &&
        (ignoreVersion || (depA.version === depB.version))
  }

  get isVersioned () : boolean {
    return this.version !== undefined
  }

  get scopedName () : string {
    return this.scope ? `@${this.scope}/${this.name}` : this.name
  }

  withoutVersion () : Dependency {
    return new Dependency(this.name, { scope: this.scope })
  }

  toString () : string {
    return `${this.scope ? `@${this.scope}/` : ''}` +
          `${this.name}` +
          `${this.version ? `@${this.version}` : ''}`
  }
}
