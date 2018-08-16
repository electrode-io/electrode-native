import { ContainerMetadata } from './types'
import { fileUtils } from 'ern-core'
import { getContainerMetadataPath } from './getContainerMetadataPath'

export async function getContainerMetadata(
  containerPath: string
): Promise<ContainerMetadata> {
  const pathToMetadataFile = getContainerMetadataPath(containerPath)
  return fileUtils.readJSON(pathToMetadataFile)
}
