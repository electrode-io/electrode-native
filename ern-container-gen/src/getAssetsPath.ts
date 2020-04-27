import { NativePlatform } from 'ern-core';
import path from 'path';

export function getAssetsPath(
  platform: NativePlatform,
  assetDirectoryName: string,
): string {
  return platform === 'android'
    ? path.normalize(`lib/src/main/assets/${assetDirectoryName}`)
    : path.normalize('ElectrodeContainer/Resources');
}
