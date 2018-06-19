import { CauldronNativeAppPlatform } from './CauldronNativeAppPlatform'

export interface CauldronNativeApp {
  name: string
  platforms: CauldronNativeAppPlatform[]
  config?: any
}
