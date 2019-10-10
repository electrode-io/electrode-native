import * as fs from 'fs'
import got from 'got'
import FormData from 'form-data'
import { AppVersionDescriptor } from './descriptors'
import { createProxyAgentFromErnConfig } from './createProxyAgent'

export class SourceMapStoreSdk {
  public readonly gotCommonOpts = {
    agent: createProxyAgentFromErnConfig('sourceMapStoreProxy'),
  }

  constructor(public readonly host: string) {}

  public createSourceMapForm(sourceMapPath: string): FormData {
    const sourceMapRs = fs.createReadStream(sourceMapPath)
    const form = new FormData()
    form.append('sourcemap', sourceMapRs)
    return form
  }

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
      const form = this.createSourceMapForm(sourceMapPath)
      await got.post(
        `http://${this.host}/sourcemaps/codepush/${descriptor.name}/${
          descriptor.platform
        }/${descriptor.version}/${deploymentName}/${label}`,
        { ...this.gotCommonOpts, body: form }
      )
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
      await got.post(
        `http://${this.host}/sourcemaps/codepush/copy/${descriptor.name}/${
          descriptor.platform
        }/${
          descriptor.version
        }/${deploymentName}/${label}/${toVersion}/${toDeploymentName}/${toLabel}`,
        this.gotCommonOpts
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
      const form = this.createSourceMapForm(sourceMapPath)
      await got.post(
        `http://${this.host}/sourcemaps/container/${descriptor.name}/${
          descriptor.platform
        }/${descriptor.version}/${containerVersion}`,
        { ...this.gotCommonOpts, body: form }
      )
    } catch (err) {
      throw new Error(err.response ? err.response.text : err.message)
    }
  }
}
