import { PackagePath, MiniApp, BundlingResult, NativePlatform } from 'ern-core'

export interface ContainerGeneratorPaths {
  /**
   * Where we assemble the miniapps together
   */
  compositeMiniApp: string
  /**
   * Where we download plugins
   */
  pluginsDownloadDirectory: string
  /**
   * Where we output final generated container
   */
  outDirectory: string
}

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

export interface ContainerGenResult {
  /**
   *  Metadata resulting from the bundling
   */
  bundlingResult: BundlingResult
}

export interface ContainerGenerator {
  /**
   *  Name of the Container Generator
   */
  readonly name: string
  /**
   * Native platform that this generator targets
   */
  readonly platform: string
  /**
   *  Generate a Container
   */
  generate(config: ContainerGeneratorConfig): Promise<ContainerGenResult>
}
