import { CauldronNativeAppPlatform } from './CauldronNativeAppPlatform';
import { CauldronObject } from './CauldronObject';

export interface CauldronNativeApp extends CauldronObject {
  platforms: CauldronNativeAppPlatform[];
}
