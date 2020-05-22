import {
  BaseMiniApp,
  findNativeDependencies,
  manifest,
  nativeDepenciesVersionResolution,
  NativeDependencies,
  NativePlatform,
  PackagePath,
  readPackageJson,
  readPackageJsonSync,
} from 'ern-core'
import { CompositeGeneratorConfig } from './types'
import { generateComposite } from './generateComposite'
import path from 'path'
import { Composite } from './Composite'

export class GeneratedComposite implements Composite {
  public static async generate(
    config: CompositeGeneratorConfig
  ): Promise<GeneratedComposite> {
    await generateComposite(config)
    return new GeneratedComposite(config)
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

  public async getJsApiImpls(): Promise<PackagePath[]> {
    return Promise.resolve(this.config.jsApiImplDependencies ?? [])
  }

  public async getMiniApps(): Promise<BaseMiniApp[]> {
    const miniAppsPackages = await this.getMiniAppsPackages()
    return miniAppsPackages.map(
      p => new BaseMiniApp({ miniAppPath: p.path, packagePath: p.packagePath })
    )
  }

  public async getResolvedNativeDependencies(): Promise<{
    pluginsWithMismatchingVersions: string[]
    resolved: PackagePath[]
  }> {
    const nativeDependencies = await this.getNativeDependencies()
    return nativeDepenciesVersionResolution.resolveNativeDependenciesVersionsEx(
      nativeDependencies
    )
  }

  public async getInjectableNativeDependencies(
    platform: NativePlatform
  ): Promise<PackagePath[]> {
    const dependencies = await this.getResolvedNativeDependencies()
    const result: PackagePath[] = []
    for (const dependency of dependencies.resolved) {
      // Always include react-native
      if (dependency.name === 'react-native') {
        result.push(dependency)
        continue
      }

      if (platform === 'android') {
        if (await manifest.getPluginConfig(dependency, 'android')) {
          result.push(dependency)
        }
      } else {
        if (await manifest.getPluginConfig(dependency, 'ios')) {
          result.push(dependency)
        }
      }
    }
    return result
  }

  /**
   * Get the package name of the MiniApps present in this Composite
   */
  public async getMiniAppsPackages(): Promise<
    Array<{
      name: string
      path: string
      packagePath: PackagePath
    }>
  > {
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

    // Also add all local miniapps
    const localMiniApps = this.config.miniApps.filter(m => m.isFilePath)
    for (const m of localMiniApps) {
      const pJson = await readPackageJson(m.basePath)
      result.push({
        name: pJson.name,
        packagePath: m,
        path: m.basePath,
      })
    }

    return Promise.resolve(result)
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

    const localMiniApps = this.config.miniApps.filter(m => m.isFilePath)

    const nativeDependencies = await findNativeDependencies(
      [
        this.path,
        ...localMiniApps.map(m => path.join(m.basePath, 'node_modules')),
      ],
      {
        manifestId,
      }
    )

    // Filter out MiniApps that can be falsy considered as native dependencies
    // if developer(s) forgot to npm ignore the android/ios directory
    const miniAppsPackages = await this.getMiniAppsPackages()
    const miniAppsPaths = miniAppsPackages.map(p => p.path)
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
