import { NativePlatform } from 'ern-core'
import { getContainerMetadataPath } from './getContainerMetadataPath'
import { inferContainerPlatform } from './inferContainerPlatform'
import fs from 'fs'

/**
 * Get the native platform of a Container given its path.
 * The platform is retrieved from the Container metadata file if present.
 * If Container metadata is missing (ern < 0.17) or if the platform is missing
 * from the metadata (ern < 0.19.0) this function will fallback to infering
 * the Container platform
 * @param containerPath Local file system path to the Container
 */
export function getContainerPlatform(containerPath: string): NativePlatform {
  if (!fs.existsSync(containerPath)) {
    throw new Error(`${containerPath} does not exist`)
  }
  const containerMetadataPath = getContainerMetadataPath(containerPath)
  if (!fs.existsSync(containerMetadataPath)) {
    return inferContainerPlatform(containerPath)
  }

  const containerMetadataFile = fs.readFileSync(containerMetadataPath)
  const containerMetadata = JSON.parse(containerMetadataFile.toString())
  if (!containerMetadata.platform) {
    return inferContainerPlatform(containerPath)
  }

  return containerMetadata.platform
}
