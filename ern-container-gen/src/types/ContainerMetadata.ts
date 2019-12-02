import { NativePlatform } from 'ern-core'

export interface ContainerMetadata {
  ernVersion: string
  miniApps: string[]
  nativeDeps: string[]
  platform: NativePlatform
}
