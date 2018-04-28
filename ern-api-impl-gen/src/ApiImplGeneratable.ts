import { PackagePath } from 'ern-core'

export interface ApiImplGeneratable {
  readonly name: string
  generate(
    apiDependency: PackagePath,
    paths: any,
    reactNativeVersion: string,
    plugins: PackagePath[],
    apis: PackagePath[],
    regen: boolean
  ): any
}
