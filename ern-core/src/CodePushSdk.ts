import CodePush from 'code-push'

export interface CodePushPackageInfo {
  appVersion?: string
  description?: string
  isDisabled?: boolean
  isMandatory?: boolean
  /* generated */ label?: string
  /* generated */ packageHash?: string
  rollout?: number
}

export interface CodePushReleaseInfo {
  /* generated */ blobUrl: string
  /* generated */ originalLabel: string
  /* generated */ originalDeployment: string
  /* generated */ releasedBy: string
  /* generated */ releaseMethod: string
  /* generated */ size: number
  /* generated */ uploadTime: number
}

export interface CodePushInitConfig {
  accessKey: string
  customHeaders?: { [headerName: string]: string }
  customServerUrl?: string
  proxy?: string
}

export type CodePushPackage = CodePushPackageInfo & CodePushReleaseInfo

export default class CodePushSdk {
  private readonly codePush: any

  constructor(initConfig: CodePushInitConfig) {
    this.codePush = new CodePush(
      initConfig.accessKey,
      initConfig.customHeaders,
      initConfig.customServerUrl,
      initConfig.proxy
    )
  }

  public async releaseReact(
    appName: string,
    deploymentName: string,
    filePath: string,
    targetBinaryVersion: string,
    updateMetadata: CodePushPackageInfo
  ): Promise<CodePushPackage> {
    if (updateMetadata.rollout === 100) {
      // If rollout is 100% we shouldn't pass it in the HTTP request
      delete updateMetadata.rollout
    }

    return this.codePush.release(
      appName,
      deploymentName,
      filePath,
      targetBinaryVersion,
      updateMetadata
    )
  }

  public async promote(
    appName: string,
    sourceDeploymentName: string,
    destinationDeploymentName: string,
    updateMetadata: CodePushPackageInfo
  ): Promise<CodePushPackage> {
    if (updateMetadata.rollout === 100) {
      // If rollout is 100% we shouldn't pass it in the HTTP request
      delete updateMetadata.rollout
    }

    return this.codePush.promote(
      appName,
      sourceDeploymentName,
      destinationDeploymentName,
      updateMetadata
    )
  }

  public async patch(
    appName: string,
    deploymentName: string,
    label: string,
    updateMetadata: CodePushPackageInfo
  ): Promise<CodePushPackage> {
    if (updateMetadata.rollout === 100) {
      // If rollout is 100% we shouldn't pass it in the HTTP request
      delete updateMetadata.rollout
    }

    return this.codePush.patchRelease(
      appName,
      deploymentName,
      label,
      updateMetadata
    )
  }
}
