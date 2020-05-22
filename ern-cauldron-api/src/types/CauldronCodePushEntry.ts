import { CauldronCodePushMetadata } from './CauldronCodePushMetadata'

export interface CauldronCodePushEntry {
  metadata: CauldronCodePushMetadata
  miniapps: string[]
  jsApiImpls: string[]
}
