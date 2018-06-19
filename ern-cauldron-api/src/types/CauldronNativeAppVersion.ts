import { CauldronContainer } from './CauldronContainer'

export interface CauldronNativeAppVersion {
  name: string
  isReleased: boolean
  binary?: string
  yarnLocks: any
  container: CauldronContainer
  codePush: any
  config?: any
  containerVersion: string
}
