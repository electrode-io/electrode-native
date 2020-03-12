import fs from 'fs-extra'
import path from 'path'
import {
  BaseMiniApp,
  findNativeDependencies,
  manifest,
  NativeDependencies,
  nativeDepenciesVersionResolution,
  NativePlatform,
  PackagePath,
  readPackageJson,
} from 'ern-core'
import { Composite } from './Composite'

export class WorkspaceComposite implements Composite {
  /**
   * Path to the Composite
   */
  public readonly path: string

  /**
   * package.json of the Composite
   */
  public readonly packageJson: any

  /**
   * Path to the workspace directory containing the miniapps
   */
  public readonly miniappsDir: string

  private cachedNativeDependencies: NativeDependencies

  public constructor(workspacePath: string) {
    this.path = workspacePath
    this.miniappsDir = path.join(workspacePath, 'miniapps')
  }

  public async getJsApiImpls(): Promise<PackagePath[]> {
    // todo
    return Promise.resolve([])
  }

  public async getMiniApps(): Promise<BaseMiniApp[]> {
    const res: BaseMiniApp[] = []
    for (const file of await fs.readdir(this.miniappsDir)) {
      const f = path.join(this.miniappsDir, file)
      if ((await fs.stat(f)).isDirectory()) {
        res.push(
          new BaseMiniApp({
            miniAppPath: f,
            packagePath: PackagePath.fromString(f),
          })
        )
      }
    }
    return res
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
      const pluginConfig = await manifest.getPluginConfig(dependency)

      if (platform === 'android' && pluginConfig?.android) {
        result.push(dependency)
      } else if (platform === 'ios' && pluginConfig?.ios) {
        result.push(dependency)
      }
    }
    return result
  }

  public async getMiniAppsPackages(): Promise<
    Array<{
      name: string
      path: string
      packagePath: PackagePath
    }>
  > {
    const miniapps = await this.getMiniApps()
    const res = []
    for (const miniapp of miniapps) {
      const pJson = await readPackageJson(miniapp.path)
      res.push({
        name: pJson.name,
        packagePath: miniapp.packagePath,
        path: miniapp.path,
      })
    }
    return res
  }

  public async getNativeDependencies({
    manifestId,
  }: {
    manifestId?: string | undefined
  } = {}): Promise<NativeDependencies> {
    if (this.cachedNativeDependencies) {
      return Promise.resolve(this.cachedNativeDependencies)
    }
    const nativeDependencies = await findNativeDependencies(
      path.join(this.path, 'node_modules'),
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
