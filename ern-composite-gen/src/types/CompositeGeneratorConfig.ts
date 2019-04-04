import { PackagePath } from 'ern-core'
export interface CompositeGeneratorConfig {
  /**
   * Base Composite
   */
  baseComposite?: PackagePath
  /**
   * Additional JavaScript dependencies to add to the Composite
   */
  extraJsDependencies?: PackagePath[]
  /**
   * JS API implementations that should be included in the generated Composite
   */
  jsApiImplDependencies?: PackagePath[]
  /**
   *  MiniApps that should be included in the generated Composite
   */
  miniApps: PackagePath[]
  /**
   * The output directory where to generate the Composite
   */
  outDir: string
  /**
   * Path to the current Composite yarn lock
   */
  pathToYarnLock?: string
}
