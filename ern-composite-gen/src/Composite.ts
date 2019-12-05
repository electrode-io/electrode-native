import {
  NativeDependencies,
  findNativeDependencies,
  PackagePath,
  readPackageJsonSync,
  BaseMiniApp,
  nativeDepenciesVersionResolution,
  manifest,
  NativePlatform,
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
    return this.config.jsApiImplDependencies ?? []
  }

  public getMiniApps(): BaseMiniApp[] {
    const result: BaseMiniApp[] = []
    return this.getMiniAppsPackages().map(
      p => new BaseMiniApp({ miniAppPath: p.path, packagePath: p.packagePath })
    )
  }

  public async getResolvedNativeDependencies() {
    const nativeDependencies = await this.getNativeDependencies()
    return nativeDepenciesVersionResolution.resolveNativeDependenciesVersionsEx(
      nativeDependencies
    )
  }

  public async getInjectableNativeDependencies(platform: NativePlatform) {
    const dependencies = await this.getResolvedNativeDependencies()
    const result: PackagePath[] = []
    for (const dependency of dependencies.resolved) {
      // Always include react-native
      if (dependency.name === 'react-native') {
        result.push(dependency)
        continue
      }
      const pluginConfig = await manifest.getPluginConfig(dependency)

      if (platform === 'android' && pluginConfig?.android) {
        result.push(dependency)
      } else if (platform === 'ios' && pluginConfig?.ios) {
        result.push(dependency)
      }
    }
    return result
  }

  /**
   * Get the package name of the MiniApps present in this Composite
   */
  public getMiniAppsPackages(): Array<{
    name: string
    path: string
    packagePath: PackagePath
  }> {
    const result: Array<{
      name: string
      path: string
      packagePath: PackagePath
    }> = []

    for (const key of Object.keys(this.packageJson.dependencies)) {
      const ppValue = PackagePath.fromString(this.packageJson.dependencies[key])
      const ppKey = PackagePath.fromString(key)

      if (
        ppValue.isFilePath ||
        this.config.miniApps.some(p => p.basePath === ppValue.basePath)
      ) {
        result.push({
          name: key,
          packagePath: ppValue,
          path: path.join(this.path, 'node_modules', key),
        })
      } else if (
        this.config.miniApps.some(p => p.basePath === ppKey.basePath)
      ) {
        result.push({
          name: key,
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
      x => !miniAppsPaths.includes(x.basePath)
    )
    nativeDependencies.thirdPartyNotInManifest = nativeDependencies.thirdPartyNotInManifest.filter(
      x => !miniAppsPaths.includes(x.basePath)
    )
    this.cachedNativeDependencies = nativeDependencies
    return this.cachedNativeDependencies
  }
}
