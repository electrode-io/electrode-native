import path from 'path'
import { containerMetadataFileName } from './consts'
import { ContainerMetadata } from './types'
import { fileUtils } from 'ern-core'

export async function getContainerMetadata(
  containerPath: string
): Promise<ContainerMetadata> {
  const pathToMetadataFile = path.join(containerPath, containerMetadataFileName)
  return fileUtils.readJSON(pathToMetadataFile)
}
