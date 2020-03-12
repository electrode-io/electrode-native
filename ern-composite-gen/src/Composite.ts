import {
  BaseMiniApp,
  NativeDependencies,
  NativePlatform,
  PackagePath,
} from 'ern-core'
export interface Composite {
  readonly path: string
  readonly packageJson: any
  getJsApiImpls(): Promise<PackagePath[]>
  getMiniApps(): Promise<BaseMiniApp[]>
  getResolvedNativeDependencies(): Promise<{
    pluginsWithMismatchingVersions: string[]
    resolved: PackagePath[]
  }>
  getInjectableNativeDependencies(
    platform: NativePlatform
  ): Promise<PackagePath[]>
  getMiniAppsPackages(): Promise<
    Array<{
      name: string
      path: string
      packagePath: PackagePath
    }>
  >
  getNativeDependencies({
    manifestId,
  }: {
    manifestId?: string
  }): Promise<NativeDependencies>
}
