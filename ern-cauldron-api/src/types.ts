export interface CauldronCodePushMetadata {
  deploymentName: string
  isMandatory?: boolean
  isDisabled?: boolean
  appVersion?: string
  size?: number
  releaseMethod?: string
  label?: string
  releasedBy?: string
  rollout?: number
  promotedFromLabel?: string
}

export interface CauldronCodePushEntry {
  metadata: CauldronCodePushMetadata
  miniapps: string[]
  jsApiImpls: string[]
}

export interface CauldronContainer {
  miniApps: string[]
  nativeDeps: string[]
  jsApiImpls: string[]
  /**
   * The ern version used to generate this Container.
   * Introduced in 0.19.0. Required from this version onward.
   * Kept optional for backward compatibility.
   */
  ernVersion?: string
}

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

export interface CauldronNativeAppPlatform {
  name: string
  versions: CauldronNativeAppVersion[]
  config?: any
}

export interface CauldronNativeApp {
  name: string
  platforms: CauldronNativeAppPlatform[]
  config?: any
}

export interface Cauldron {
  schemaVersion: string
  config?: any
  nativeApps: CauldronNativeApp[]
}

export interface ITransactional {
  beginTransaction(): Promise<void>
  commitTransaction(message: string | string[]): Promise<void>
  discardTransaction(): Promise<void>
}

export interface ICauldronDocumentAccess {
  commit(message: string): Promise<void>
  getCauldron(): Promise<Cauldron>
}

export interface ICauldronFileAccess {
  storeFile(filename: string, payload: string | Buffer): Promise<void>
  hasFile(filename: string): Promise<boolean>
  getPathToFile(filename: string): Promise<string | void>
  getFile(filename: string): Promise<Buffer | void>
  removeFile(filename: string): Promise<boolean>
}

export type ICauldronDocumentStore = ITransactional & ICauldronDocumentAccess
export type ICauldronFileStore = ITransactional & ICauldronFileAccess
