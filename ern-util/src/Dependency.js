const SCOPE_NAME_VERSION_RE = /@(.+)\/(.*)@(.*)/;
const SCOPE_NAME_NO_VERSION_RE = /@(.+)\/(.+)/;
const NAME_VERSION_RE = /(.*)@(.*)/;

export default class Dependency {

  constructor(name, { scope, version } = {}) {
    this.name = name
    this.scope = scope
    this.version = version
  }

  static fromString(str) {
    // @scope/name@version
    if (SCOPE_NAME_VERSION_RE.test(str)) {
      const scopeNameVersion = SCOPE_NAME_VERSION_RE.exec(str)
      return new Dependency(scopeNameVersion[2], {
        scope: scopeNameVersion[1], 
        version: scopeNameVersion[3]
      })
    }
    // name@version 
    else if (NAME_VERSION_RE.test(str)) {
      const nameVersion = NAME_VERSION_RE.exec(str)
      return new Dependency(nameVersion[1], { 
        version: nameVersion[2]
      })
    } 
    // @scope/name
    else if (SCOPE_NAME_NO_VERSION_RE.test(str)) {
      const scopeName = SCOPE_NAME_NO_VERSION_RE.exec(str)
      return new Dependency(nameVersion[2], { 
        version: nameVersion[1]
      })
    }
    // name
      else {
      return new Dependency(str)
    }
  }

  static same(depA, depB, { ignoreVersion = false}) {
    return (depA.name === depB.name) 
        && (depA.scope === depB.scope)
        && (ignoreVersion || (depA.version === depB.version)) 
  }

  withoutVersion() {
    return new Dependency(this.name, { scope: this.scope })
  }

  toString() {
    return `${this.scope ? `@${this.scope}/` : ''}` 
          + `${this.name}`
          + `${this.version ? `@${this.version}` : ''}` 
  }
}