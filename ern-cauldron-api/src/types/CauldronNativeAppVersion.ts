import { CauldronContainer } from './CauldronContainer'
import { CauldronObject } from './CauldronObject'

export interface CauldronNativeAppVersion extends CauldronObject {
  isReleased: boolean
  binary?: string
  yarnLocks: any
  container: CauldronContainer
  codePush: any
  containerVersion: string
  description?: string
}
