import { NativePlatform } from 'ern-core';

export interface RunnerGeneratorConfig {
  /**
   * Target native platform
   */
  targetPlatform: NativePlatform;
  /**
   * The output directory where to generate the Runner
   */
  outDir: string;
  /**
   * Name of the main MiniApp to launch with Runner
   */
  mainMiniAppName: string;
  /**
   * Indicates whether React Native dev support should be enabled
   */
  reactNativeDevSupportEnabled?: boolean;
  /**
   * Host on which the React Native packager will be launched
   */
  reactNativePackagerHost?: string;
  /**
   * Port on which the React Native packager will be launched
   */
  reactNativePackagerPort?: string;
  /**
   * Extra configuration specific to the target Runner generator
   */
  extra?: any;
  /**
   * React Native version
   */
  reactNativeVersion: string;
}
