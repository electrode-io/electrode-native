import { Platform, fileUtils } from 'ern-core'
import { ContainerGeneratorConfig, ContainerMetadata } from './types'
import { getContainerMetadataPath } from './getContainerMetadataPath'

export async function addContainerMetadata(conf: ContainerGeneratorConfig) {
  const metadata: ContainerMetadata = {
    ernVersion: Platform.currentVersion,
    jsApiImpls: conf.composite.getJsApiImpls().map(j => j.toString()),
    miniApps: conf.composite.getMiniApps().map(m => m.packagePath.toString()),
    nativeDeps: conf.plugins.map(p => p.toString()),
    platform: conf.targetPlatform,
  }
  const pathToMetadataFile = getContainerMetadataPath(conf.outDir)
  return fileUtils.writeFile(
    pathToMetadataFile,
    JSON.stringify(metadata, null, 2)
  )
}
