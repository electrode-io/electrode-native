import { BundlingResult } from 'ern-core';
import { ContainerGeneratorConfig } from './ContainerGeneratorConfig';

export interface ContainerGenResult {
  /**
   * Metadata resulting from the bundling
   */
  bundlingResult: BundlingResult;
  /**
   * Configuration used to generate the Container
   */
  config: ContainerGeneratorConfig;
}
