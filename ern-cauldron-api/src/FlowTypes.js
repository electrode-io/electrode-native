// @flow

export type CauldronCodePushMetadata = {
  deploymentName: string,
  isMandatory?: boolean,
  isDisabled?: boolean,
  appVersion?: string,
  size?: number,
  releaseMethod?: string,
  label?: string,
  releasedBy?: string,
  rollout?: number
}

export type CauldronCodePushEntry = {
  metadata: CauldronCodePushMetadata,
  miniapps: Array<string>,
  jsApiImpls: Array<string>
}

export type CauldronContainer = {
  miniApps: Array<string>,
  nativeDeps: Array<string>,
  jsApiImpls: Array<string>
}

export type CauldronNativeAppVersion = {
  name: string,
  isReleased: boolean,
  binary: ?string,
  yarnLocks: Object,
  container: CauldronContainer,
  codePush: Object,
  config?: Object,
  containerVersion: string
}

export type CauldronNativeAppPlatform = {
  name: string,
  versions: Array<CauldronNativeAppVersion>,
  config?: Object
}

export type CauldronNativeApp = {
  name: string,
  platforms: Array<CauldronNativeAppPlatform>,
  config?: Object
}

export type Cauldron = {
  schemaVersion: string,
  config?: Object,
  nativeApps: Array<CauldronNativeApp>
}

export interface ITransactional {
  beginTransaction () : Promise<void>;
  commitTransaction (message: string | Array<string>) : Promise<void>;
  discardTransaction () : Promise<void>;
}

export interface ICauldronDocumentAccess {
  commit (message: string) : Promise<void>;
  getCauldron () : Promise<Cauldron>;
}

export interface ICauldronFileAccess {
  storeFile (filename: string, payload: string|Buffer) : Promise<void>;
  hasFile (filename: string) : Promise<boolean>;
  getPathToFile (filename: string) : Promise<?string>;
  getFile (filename: string) : Promise<?Buffer>;
  removeFile (filename: string) : Promise<boolean>;

}

export type ICauldronDocumentStore = ITransactional & ICauldronDocumentAccess;
export type ICauldronFileStore = ITransactional & ICauldronFileAccess;
