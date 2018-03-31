// @flow

const FILE_PATH_WITH_PREFIX_RE = /^file:(.+)/
const FILE_PATH_WITHOUT_PREFIX_RE = /^(\/.+)/
const FILE_PATH_WITHOUT_PREFIX_WINDOWS_RE = /^[a-zA-Z]:\\[\\\S|*\S]?.*$/
const FILE_PATH_RE = new RegExp(`${FILE_PATH_WITH_PREFIX_RE.source}|${FILE_PATH_WITHOUT_PREFIX_RE.source}|${FILE_PATH_WITHOUT_PREFIX_WINDOWS_RE.source}`)
const GIT_SSH_PATH_RE = new RegExp(/^git\+ssh:\/\/.+\.git$/)
const GIT_SSH_PATH_VERSION_RE = new RegExp(/^(git\+ssh:\/\/.+\.git)#(.+)$/)
const GIT_HTTPS_PATH_RE = new RegExp(/^https:\/\/.+\.git$/)
const GIT_HTTPS_PATH_VERSION_RE = new RegExp(/^(https:\/\/.+\.git)#(.+)$/)
const GIT_PATH_RE = new RegExp(`${GIT_SSH_PATH_RE.source}|${GIT_SSH_PATH_VERSION_RE.source}|${GIT_HTTPS_PATH_RE.source}|${GIT_HTTPS_PATH_VERSION_RE.source}`)
const REGISTRY_PATH_VERSION_RE = new RegExp(/^(.+)@(.+)$/)

export default class PackagePath {
  // Full path provided to the constructor
  _fullPath: string

  // Package path without version
  // File path        : path without scheme prefix
  // Git path         : path without scheme prefix nor branch/tag/commit
  // Descriptor path  : package name (unscoped)
  _basePath: string

  // Version of the package
  // File path        : undefined
  // Git path         : branch/tag/commit || undefined
  // Descriptor path  : package version || undefined
  _version: string

  constructor (path: string) {
    this._fullPath = path
    if (GIT_SSH_PATH_RE.test(path) || GIT_HTTPS_PATH_RE.test(path)) {
      this._basePath = path
    } else if (GIT_SSH_PATH_VERSION_RE.test(path)) {
      this._basePath = GIT_SSH_PATH_VERSION_RE.exec(path)[1]
      this._version = GIT_SSH_PATH_VERSION_RE.exec(path)[2]
    } else if (GIT_HTTPS_PATH_VERSION_RE.test(path)) {
      this._basePath = GIT_HTTPS_PATH_VERSION_RE.exec(path)[1]
      this._version = GIT_HTTPS_PATH_VERSION_RE.exec(path)[2]
    } else if (REGISTRY_PATH_VERSION_RE.test(path)) {
      this._basePath = REGISTRY_PATH_VERSION_RE.exec(path)[1]
      this._version = REGISTRY_PATH_VERSION_RE.exec(path)[2]
    } else if (FILE_PATH_WITH_PREFIX_RE.test(path)) {
      this._basePath = FILE_PATH_WITH_PREFIX_RE.exec(path)[1]
    } else if (FILE_PATH_WITHOUT_PREFIX_RE.test(path)) {
      this._basePath = FILE_PATH_WITHOUT_PREFIX_RE.exec(path)[1]
    } else {
      this._basePath = path
    }
  }

  static fromString (path: string) {
    return new PackagePath(path)
  }

  get version () : ?string {
    return this._version
  }

  get isGitPath () : boolean {
    return GIT_PATH_RE.test(this._fullPath)
  }

  get isFilePath () : boolean {
    return FILE_PATH_RE.test(this._fullPath)
  }

  get isRegistryPath () : boolean {
    return !this.isGitPath && !this.isFilePath
  }

  get basePath () : string {
    return this._basePath
  }

  same (other: PackagePath, {
    ignoreVersion
  } : {
    ignoreVersion?: boolean
  } = {}) {
    return this.basePath === other.basePath &&
           (ignoreVersion ? true : this.version === other.version)
  }

  toString () : string {
    return this._fullPath
  }
}
