import { NativePlatform } from 'ern-core';

export interface ContainerMetadata {
  ernVersion: string;
  jsApiImpls: string[];
  miniApps: string[];
  nativeDeps: string[];
  platform: NativePlatform;
}
