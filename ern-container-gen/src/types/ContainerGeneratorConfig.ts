import { MiniApp, NativePlatform, PackagePath } from 'ern-core'

export interface ContainerGeneratorConfig {
  /**
   * The MiniApps that should be included in the generated Container
   */
  miniApps: MiniApp[]
  /**
   * The plugins that should be included in the generated Container
   */
  plugins: PackagePath[]
  /**
   * The JS API implementations that should be included in the generated Container
   */
  jsApiImpls: PackagePath[]
  /**
   * The output directory where to generate the Container
   */
  outDir: string
  /**
   * Directory where the plugins should be downloaded to during generation
   */
  pluginsDownloadDir: string
  /**
   * Directory where the MiniApps will be composed together during generation
   */
  compositeMiniAppDir: string
  /**
   * Target native platform
   */
  targetPlatform: NativePlatform
  /**
   * Indicates whether rmpm assets should be included in the Container
   */
  ignoreRnpmAssets?: boolean
  /**
   * Path to the current yarn lock
   */
  pathToYarnLock?: string
}
