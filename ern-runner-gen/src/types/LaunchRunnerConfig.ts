import { NativePlatform } from 'ern-core'
export interface LaunchRunnerConfig {
  /**
   * Directory where the native platform project is located.
   */
  pathToRunner: string

  /**
   * Target native platform
   */
  platform: NativePlatform

  /**
   * Extra configuration needed to launch the miniapp.
   */
  extra?: any
}
