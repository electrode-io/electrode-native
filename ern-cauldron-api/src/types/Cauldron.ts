import { CauldronNativeApp } from './CauldronNativeApp'
export interface Cauldron {
  ernVersion?: string
  schemaVersion: string
  config?: any
  nativeApps: CauldronNativeApp[]
}
