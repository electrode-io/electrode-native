import { CauldronNativeApp } from './CauldronNativeApp'
import { CauldronObject } from './CauldronObject'
export interface Cauldron extends CauldronObject {
  ernVersion?: string
  schemaVersion: string
  nativeApps: CauldronNativeApp[]
}
