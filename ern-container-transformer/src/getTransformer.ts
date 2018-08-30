import { ModuleFactory, Platform, PackagePath } from 'ern-core'
import { ContainerTransformer } from './types'

const ERN_TRANSFORMER_PACKAGE_PREFIX = 'ern-container-transformer-'
const ERN_TRANSFORMER_CACHE_DIRECTORY =
  Platform.containerTransformersCacheDirectory

const transformerFactory = new ModuleFactory<ContainerTransformer>(
  ERN_TRANSFORMER_PACKAGE_PREFIX,
  ERN_TRANSFORMER_CACHE_DIRECTORY
)

export default async function getTransformer(
  transformer: string
): Promise<ContainerTransformer> {
  return transformerFactory.getModuleInstance(
    PackagePath.fromString(transformer)
  )
}
