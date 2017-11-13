// @flow

import CodePush from 'code-push'

export type PackageInfo = {
  appVersion?: string;
  description?: string;
  isDisabled?: boolean;
  isMandatory?: boolean;
  label?: string;
  packageHash?: string;
  rollout?: number;
}

export default class CodePushSdk {
  _codePush: any

  constructor (accessKey: string) {
    this._codePush = new CodePush(accessKey)
  }

  async releaseReact (
    appName: string,
    deploymentName: string,
    filePath: string,
    targetBinaryVersion: string,
    updateMetadata: PackageInfo) : Promise<void> {
    return this._codePush.release(
        appName,
        deploymentName,
        filePath,
        targetBinaryVersion,
        updateMetadata
      )
  }
}
