import { Platform } from 'ern-core'
import { ContainerGeneratorConfig } from './types'
import { containerMetadataFileName } from './consts'
import { writeFile } from './writeFile'
import path from 'path'

export async function addElectrodeNativeMetadataFile(
  conf: ContainerGeneratorConfig
) {
  const metadata = {
    ernVersion: Platform.currentVersion,
    jsApiImpls: conf.jsApiImpls.map(j => j.toString()),
    miniApps: conf.miniApps.map(m => m.packagePath.toString()),
    nativeDeps: conf.plugins.map(p => p.toString()),
    platform: conf.targetPlatform,
  }
  const pathToMetadataFile = path.join(conf.outDir, containerMetadataFileName)
  return writeFile(pathToMetadataFile, JSON.stringify(metadata, null, 2))
}
