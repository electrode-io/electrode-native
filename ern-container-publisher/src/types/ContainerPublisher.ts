import { NativePlatform } from 'ern-core';
import { ContainerPublisherConfig } from './ContainerPublisherConfig';

export interface ContainerPublisher {
  /**
   *  Name of the Container publisher
   */
  readonly name: string;
  /**
   * An array of one or more native platform(s)
   * that the Container publisher supports
   */
  readonly platforms: NativePlatform[];
  /**
   *  Publish a Container
   */
  publish(config: ContainerPublisherConfig): Promise<void>;
}
