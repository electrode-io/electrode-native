import { NativePlatform, PackagePath, BaseMiniApp } from 'ern-core'
import { Composite } from 'ern-composite-gen'

export interface ContainerGeneratorConfig {
  /**
   * The plugins that should be included in the generated Container
   */
  plugins: PackagePath[]
  /**
   * The output directory where to generate the Container
   */
  outDir: string
  /**
   * Composite
   */
  composite: Composite
  /**
   * Target native platform
   */
  targetPlatform: NativePlatform
  /**
   * Indicates whether rmpm assets should be included in the Container
   */
  ignoreRnpmAssets?: boolean
  /**
   * Android config that should be included to override default build settings
   */
  androidConfig?: any
  /**
   * JS main module name. Usually 'index' (for newest RN version) or
   * 'index.android'/'index.ios' (for older RN versions)
   */
  jsMainModuleName?: string
  /**
   * Path to source map file
   */
  sourceMapOutput?: string
  /**
   * Indicates whether to generate a dev or release JS bundle
   */
  devJsBundle?: boolean
}
