import {
  NativeDependencies,
  findNativeDependencies,
  PackagePath,
  NativeDependency,
  readPackageJsonSync,
  BaseMiniApp,
  nativeDepenciesVersionResolution,
} from 'ern-core'
import { CompositeGeneratorConfig } from './types'
import { generateComposite } from './generateComposite'
import path from 'path'

export class Composite {
  public static async generate(
    config: CompositeGeneratorConfig
  ): Promise<Composite> {
    await generateComposite(config)
    return new Composite(config)
  }

  /**
   * The configuration that was used to generate this Composite
   */
  public readonly config: CompositeGeneratorConfig

  /**
   * Path to the Composite
   */
  public readonly path: string

  /**
   * package.json of the Composite
   */
  public readonly packageJson: any

  private cachedNativeDependencies: NativeDependencies

  private constructor(config: CompositeGeneratorConfig) {
    this.config = config
    this.path = config.outDir
    this.packageJson = readPackageJsonSync(config.outDir)
  }

  public getJsApiImpls(): PackagePath[] {
    return this.config.jsApiImplDependencies || []
  }

  public getMiniApps(): BaseMiniApp[] {
    const result: BaseMiniApp[] = []
    return this.getMiniAppsPackages().map(
      p => new BaseMiniApp({ miniAppPath: p.path, packagePath: p.packagePath })
    )
  }

  public async getResolvedNativeDependencies(): Promise<any> {
    const nativeDependencies = await this.getNativeDependencies()
    return nativeDepenciesVersionResolution.resolveNativeDependenciesVersionsEx(
      nativeDependencies
    )
  }

  /**
   * Get the package name of the MiniApps present in this Composite
   */
  public getMiniAppsPackages(): Array<{
    path: string
    packagePath: PackagePath
  }> {
    const result: Array<{ path: string; packagePath: PackagePath }> = []

    for (const key of Object.keys(this.packageJson.dependencies)) {
      const ppValue = PackagePath.fromString(this.packageJson.dependencies[key])
      const ppKey = PackagePath.fromString(key)

      if (
        ppValue.isFilePath ||
        this.config.miniApps.some(p => p.basePath === ppValue.basePath)
      ) {
        result.push({
          packagePath: ppValue,
          path: path.join(this.path, 'node_modules', key),
        })
      } else if (
        this.config.miniApps.some(p => p.basePath === ppKey.basePath)
      ) {
        result.push({
          packagePath: PackagePath.fromString(
            `${key}@${this.packageJson.dependencies[key]}`
          ),
          path: path.join(this.path, 'node_modules', key),
        })
      }
    }
    return result
  }

  /**
   * Get all native dependencies packages found in this Composite
   */
  public async getNativeDependencies({
    manifestId,
  }: { manifestId?: string } = {}): Promise<NativeDependencies> {
    if (this.cachedNativeDependencies) {
      return Promise.resolve(this.cachedNativeDependencies)
    }
    const nativeDependencies = await findNativeDependencies(this.path, {
      manifestId,
    })

    // Filter out MiniApps that can be falsy considered as native dependencies
    // if developer(s) forgot to npm ignore the android/ios directory
    const miniAppsPaths = this.getMiniAppsPackages().map(p => p.path)
    nativeDependencies.all = nativeDependencies.all.filter(
      x => !miniAppsPaths.includes(x.path)
    )
    nativeDependencies.thirdPartyNotInManifest = nativeDependencies.thirdPartyNotInManifest.filter(
      x => !miniAppsPaths.includes(x.path)
    )
    this.cachedNativeDependencies = nativeDependencies
    return this.cachedNativeDependencies
  }

  /**
   * Get the local absolute path of a given native dependency in this Composite
   * Returns undefined if no matching dependency was found in this Composite
   * @param d Native dependency to find in the composite
   */
  public async getNativeDependencyPath(d: PackagePath): Promise<string | void> {
    const dependencies = await this.getNativeDependencies()
    const dependency: NativeDependency | void = dependencies.all.find(x =>
      x.packagePath.same(d)
    )
    if (dependency) {
      return dependency.path
    }
  }
}
