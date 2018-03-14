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

export type CodePushInitConfig = {
  accessKey: string,
  customHeaders?: {[headerName: string]: string},
  customServerUrl?: string,
  proxy?: string
}

export type CodePushPackage = CodePushPackageInfo & CodePushReleaseInfo;

export default class CodePushSdk {
  _codePush: any

  constructor (initConfig: CodePushInitConfig) {
    this._codePush = new CodePush(initConfig.accessKey, initConfig.customHeaders, initConfig.customServerUrl, initConfig.proxy)
  }

  async releaseReact (
    appName: string,
    deploymentName: string,
    filePath: string,
    targetBinaryVersion: string,
    updateMetadata: CodePushPackageInfo) : Promise<CodePushPackage> {
    if (updateMetadata.rollout === 100) {
      // If rollout is 100% we shouldn't pass it in the HTTP request
      delete updateMetadata.rollout
    }

    return this._codePush.release(
      appName,
      deploymentName,
      filePath,
      targetBinaryVersion,
      updateMetadata)
  }

  async promote (
    appName: string,
    sourceDeploymentName: string,
    destinationDeploymentName: string,
    updateMetadata: CodePushPackageInfo) : Promise<CodePushPackage> {
    if (updateMetadata.rollout === 100) {
      // If rollout is 100% we shouldn't pass it in the HTTP request
      delete updateMetadata.rollout
    }

    return this._codePush.promote(
      appName,
      sourceDeploymentName,
      destinationDeploymentName,
      updateMetadata)
  }

  async patch (
    appName: string,
    deploymentName: string,
    label: string,
    updateMetadata: CodePushPackageInfo) : Promise<CodePushPackage> {
    if (updateMetadata.rollout === 100) {
      // If rollout is 100% we shouldn't pass it in the HTTP request
      delete updateMetadata.rollout
    }

    return this._codePush.patchRelease(
      appName,
      deploymentName,
      label,
      updateMetadata)
  }
}
