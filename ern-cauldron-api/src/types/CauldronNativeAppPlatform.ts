import { CauldronNativeAppVersion } from './CauldronNativeAppVersion'

export interface CauldronNativeAppPlatform {
  name: string
  versions: CauldronNativeAppVersion[]
  config?: any
}
