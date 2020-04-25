import CodePush from 'code-push'
import log from './log'

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
    updateMetadata: CodePushPackageInfo,
    disableDuplicateReleaseError?: boolean
  ): Promise<CodePushPackage | void> {
    if (updateMetadata.rollout === 100) {
      // If rollout is 100% we shouldn't pass it in the HTTP request
      delete updateMetadata.rollout
    }
    try {
      const res = await this.codePush.release(
        appName,
        deploymentName,
        filePath,
        targetBinaryVersion,
        updateMetadata
      )
      return res
    } catch (error) {
      if (
        disableDuplicateReleaseError &&
        error.statusCode === CodePush.ERROR_CONFLICT
      ) {
        log.warn(error.message)
      } else {
        throw new Error(JSON.stringify(error))
      }
    }
  }

  public async promote(
    appName: string,
    sourceDeploymentName: string,
    destinationDeploymentName: string,
    updateMetadata: CodePushPackageInfo,
    disableDuplicateReleaseError?: boolean
  ): Promise<CodePushPackage | void> {
    if (updateMetadata.rollout === 100) {
      // If rollout is 100% we shouldn't pass it in the HTTP request
      delete updateMetadata.rollout
    }
    try {
      const res = await this.codePush.promote(
        appName,
        sourceDeploymentName,
        destinationDeploymentName,
        updateMetadata
      )
      return res
    } catch (error) {
      if (
        disableDuplicateReleaseError &&
        error.statusCode === CodePush.ERROR_CONFLICT
      ) {
        log.warn(error.message)
      } else {
        throw new Error(JSON.stringify(error))
      }
    }
  }

  public async patch(
    appName: string,
    deploymentName: string,
    updateMetadata: CodePushPackageInfo
  ): Promise<CodePushPackage> {
    if (updateMetadata.rollout === 100) {
      // If rollout is 100% we shouldn't pass it in the HTTP request
      delete updateMetadata.rollout
    }

    return this.codePush.patchRelease(
      appName,
      deploymentName,
      updateMetadata.label,
      updateMetadata
    )
  }
}
