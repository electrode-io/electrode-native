import { ContainerMetadata } from './types'
import { fileUtils } from 'ern-core'
import { getContainerMetadataPath } from './getContainerMetadataPath'
import fs from 'fs'

export async function getContainerMetadata(
  containerPath: string
): Promise<ContainerMetadata | void> {
  const pathToMetadataFile = getContainerMetadataPath(containerPath)
  if (fs.existsSync(pathToMetadataFile)) {
    return fileUtils.readJSON(pathToMetadataFile)
  }
}
