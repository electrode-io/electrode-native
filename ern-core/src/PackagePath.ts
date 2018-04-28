const FILE_PATH_WITH_PREFIX_RE = /^file:(.+)/
const FILE_PATH_WITHOUT_PREFIX_RE = /^(\/.+)/
const FILE_PATH_WITHOUT_PREFIX_WINDOWS_RE = /^[a-zA-Z]:\\[\\\S|*\S]?.*$/
const FILE_PATH_RE = new RegExp(
  `${FILE_PATH_WITH_PREFIX_RE.source}|${FILE_PATH_WITHOUT_PREFIX_RE.source}|${
    FILE_PATH_WITHOUT_PREFIX_WINDOWS_RE.source
  }`
)
const GIT_SSH_PATH_RE = new RegExp(/^git\+ssh:\/\/.+\.git$/)
const GIT_SSH_PATH_VERSION_RE = new RegExp(/^(git\+ssh:\/\/.+\.git)#(.+)$/)
const GIT_HTTPS_PATH_RE = new RegExp(/^https:\/\/.+\.git$/)
const GIT_HTTPS_PATH_VERSION_RE = new RegExp(/^(https:\/\/.+\.git)#(.+)$/)
const GIT_PATH_RE = new RegExp(
  `${GIT_SSH_PATH_RE.source}|${GIT_SSH_PATH_VERSION_RE.source}|${
    GIT_HTTPS_PATH_RE.source
  }|${GIT_HTTPS_PATH_VERSION_RE.source}`
)
const REGISTRY_PATH_VERSION_RE = new RegExp(/^(.+)@(.+)$/)

export class PackagePath {
  /**
   * Creates a PackagePath from a string
   * @param path Full path to the package (registry|git|file)
   */
  public static fromString(path: string) {
    return new PackagePath(path)
  }

  /**
   * Full path to the package
   */
  public readonly fullPath: string

  /**
   * Package path without version
   * - File path        : path without scheme prefix
   * - Git path         : path without scheme prefix nor branch/tag/commit
   * - Registry path    : package name (unscoped)
   */
  public readonly basePath: string

  /**
   * Version of the package
   * - File path        : undefined
   * - Git path         : branch/tag/commit || undefined
   * - Descriptor path  : package version || undefined
   */
  public readonly version?: string

  /**
   * Creates a PackagePath
   * @param path Full path to the package (registry|git|file)
   */
  constructor(path: string) {
    this.fullPath = path
    if (GIT_SSH_PATH_RE.test(path) || GIT_HTTPS_PATH_RE.test(path)) {
      this.basePath = path
    } else if (GIT_SSH_PATH_VERSION_RE.test(path)) {
      this.basePath = GIT_SSH_PATH_VERSION_RE.exec(path)[1]
      this.version = GIT_SSH_PATH_VERSION_RE.exec(path)[2]
    } else if (GIT_HTTPS_PATH_VERSION_RE.test(path)) {
      this.basePath = GIT_HTTPS_PATH_VERSION_RE.exec(path)[1]
      this.version = GIT_HTTPS_PATH_VERSION_RE.exec(path)[2]
    } else if (REGISTRY_PATH_VERSION_RE.test(path)) {
      this.basePath = REGISTRY_PATH_VERSION_RE.exec(path)[1]
      this.version = REGISTRY_PATH_VERSION_RE.exec(path)[2]
    } else if (FILE_PATH_WITH_PREFIX_RE.test(path)) {
      this.basePath = FILE_PATH_WITH_PREFIX_RE.exec(path)[1]
    } else if (FILE_PATH_WITHOUT_PREFIX_RE.test(path)) {
      this.basePath = FILE_PATH_WITHOUT_PREFIX_RE.exec(path)[1]
    } else {
      this.basePath = path
    }
  }

  get isGitPath(): boolean {
    return GIT_PATH_RE.test(this.fullPath)
  }

  get isFilePath(): boolean {
    return FILE_PATH_RE.test(this.fullPath)
  }

  get isRegistryPath(): boolean {
    return !this.isGitPath && !this.isFilePath
  }

  public same(
    other: PackagePath,
    {
      ignoreVersion,
    }: {
      ignoreVersion?: boolean
    } = {}
  ) {
    return (
      this.basePath === other.basePath &&
      (ignoreVersion ? true : this.version === other.version)
    )
  }

  public toString(): string {
    return this.fullPath
  }
}
