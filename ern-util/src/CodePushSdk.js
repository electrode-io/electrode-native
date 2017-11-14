// @flow

import CodePush from 'code-push'

export type CodePushPackageInfo = {
  appVersion?: string;
  description?: string;
  isDisabled?: boolean;
  isMandatory?: boolean;
  /* generated */ label?: string;
  /* generated */ packageHash?: string;
  rollout?: number;
};

export type CodePushReleaseInfo = {
  /* generated */ blobUrl: string;
  /* generated */ originalLabel: string;
  /* generated */ originalDeployment: string;
  /* generated */ releasedBy: string;
  /* generated */ releaseMethod: string;
  /* generated */ size: number;
  /* generated */ uploadTime: number;
};

export type CodePushPackage = CodePushPackageInfo & CodePushReleaseInfo;

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
    updateMetadata: CodePushPackageInfo) : Promise<CodePushPackage> {
    const response = await this._codePush.release(
        appName,
        deploymentName,
        filePath,
        targetBinaryVersion,
        updateMetadata)
    return response.package
  }
}
