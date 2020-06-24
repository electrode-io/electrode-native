import { ContainerMetadata } from './types';
import { getContainerMetadataPath } from './getContainerMetadataPath';
import fs from 'fs-extra';

export async function getContainerMetadata(
  containerPath: string,
): Promise<ContainerMetadata | void> {
  const pathToMetadataFile = getContainerMetadataPath(containerPath);
  if (await fs.pathExists(pathToMetadataFile)) {
    return fs.readJson(pathToMetadataFile);
  }
}
