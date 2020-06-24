import { CauldronNativeAppVersion } from './CauldronNativeAppVersion';
import { CauldronObject } from './CauldronObject';

export interface CauldronNativeAppPlatform extends CauldronObject {
  versions: CauldronNativeAppVersion[];
  containerVersion?: string;
}
