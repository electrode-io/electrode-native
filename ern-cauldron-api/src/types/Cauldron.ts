import { CauldronNativeApp } from './CauldronNativeApp'
export interface Cauldron {
  schemaVersion: string
  config?: any
  nativeApps: CauldronNativeApp[]
}
