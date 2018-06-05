import { containerMetadataFileName } from './consts'
import path from 'path'

export function getContainerMetadataPath(containerPath: string): string {
  return path.join(containerPath, containerMetadataFileName)
}
