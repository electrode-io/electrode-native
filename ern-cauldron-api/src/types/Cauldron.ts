import { CauldronNativeApp } from './CauldronNativeApp';
import { CauldronObject } from './CauldronObject';

export interface Cauldron extends CauldronObject {
  schemaVersion: string;
  nativeApps: CauldronNativeApp[];
}
