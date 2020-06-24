import { NativePlatform } from 'ern-core';

export interface LaunchRunnerConfig {
  /**
   * Extra configuration needed to launch the miniapp.
   */
  extra?: any;

  /**
   * Directory where the native platform project is located.
   */
  pathToRunner: string;

  /**
   * Target native platform
   */
  platform: NativePlatform;
}
