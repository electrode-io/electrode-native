import * as fs from 'fs'
import superagent from 'superagent'
import { AppVersionDescriptor } from './descriptors'

export class SourceMapStoreSdk {
  constructor(public readonly host: string) {}

  public async uploadCodePushSourceMap({
    descriptor,
    deploymentName,
    label,
    sourceMapPath,
  }: {
    descriptor: AppVersionDescriptor
    deploymentName: string
    label: string
    sourceMapPath: string
  }) {
    try {
      const sourceMapRs = fs.createReadStream(sourceMapPath)
      return superagent
        .post(
          `http://${this.host}/sourcemaps/codepush/${descriptor.name}/${
            descriptor.platform
          }/${descriptor.version}/${deploymentName}/${label}`
        )
        .attach('sourcemap', sourceMapRs)
    } catch (err) {
      throw new Error(err.response ? err.response.text : err.message)
    }
  }

  public async copyCodePushSourceMap({
    descriptor,
    deploymentName,
    label,
    toVersion,
    toDeploymentName,
    toLabel,
  }: {
    descriptor: AppVersionDescriptor
    deploymentName: string
    label: string
    toVersion: string
    toDeploymentName: string
    toLabel: string
  }) {
    try {
      return superagent.post(
        `http://${this.host}/sourcemaps/codepush/copy/${descriptor.name}/${
          descriptor.platform
        }/${
          descriptor.version
        }/${deploymentName}/${label}/${toVersion}/${toDeploymentName}/${toLabel}`
      )
    } catch (err) {
      throw new Error(err.response ? err.response.text : err.message)
    }
  }

  public async uploadContainerSourceMap({
    descriptor,
    containerVersion,
    sourceMapPath,
  }: {
    descriptor: AppVersionDescriptor
    containerVersion: string
    sourceMapPath: string
  }) {
    try {
      const sourceMapRs = fs.createReadStream(sourceMapPath)
      return superagent
        .post(
          `http://${this.host}/sourcemaps/container/${descriptor.name}/${
            descriptor.platform
          }/${descriptor.version}/${containerVersion}`
        )
        .attach('sourcemap', sourceMapRs)
    } catch (err) {
      throw new Error(err.response ? err.response.text : err.message)
    }
  }
}
