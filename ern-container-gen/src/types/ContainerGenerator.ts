import { NativePlatform } from 'ern-core'
import { ContainerGeneratorConfig } from './ContainerGeneratorConfig'
import { ContainerGenResult } from './ContainerGenResult'

export interface ContainerGenerator {
  /**
   *  Name of the Container Generator
   */
  readonly name: string
  /**
   * Native platform that this generator targets
   */
  readonly platform: NativePlatform
  /**
   *  Generate a Container
   */
  generate(config: ContainerGeneratorConfig): Promise<ContainerGenResult>
}
