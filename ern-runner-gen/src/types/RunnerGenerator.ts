import { NativePlatform } from 'ern-core';
import { RunnerGeneratorConfig } from './RunnerGeneratorConfig';

export interface RunnerGenerator {
  /**
   * Native platform that this generator targets
   */
  readonly platform: NativePlatform;
  /**
   * Generate a Runner
   */
  generate(config: RunnerGeneratorConfig): Promise<void>;
  /**
   * Regenerate Runner configuration
   */
  regenerateRunnerConfig(config: RunnerGeneratorConfig): Promise<void>;
}
