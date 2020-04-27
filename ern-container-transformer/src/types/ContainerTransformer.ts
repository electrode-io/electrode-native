import { NativePlatform } from 'ern-core';
import { ContainerTransformerConfig } from './ContainerTransformerConfig';

export interface ContainerTransformer {
  /**
   * Name of the Container publisher
   */
  readonly name: string;
  /**
   * An array of one or more native platform(s)
   * that the Container transformer supports
   */
  readonly platforms: NativePlatform[];
  /**
   * Transform a Container
   */
  transform(config: ContainerTransformerConfig): Promise<void>;
}
