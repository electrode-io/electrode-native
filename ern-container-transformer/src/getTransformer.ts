import { ModuleFactory, PackagePath, Platform } from 'ern-core'
import { ContainerTransformer } from './types'

const ERN_TRANSFORMER_CACHE_DIRECTORY =
  Platform.containerTransformersCacheDirectory

const transformerFactory = new ModuleFactory<ContainerTransformer>(
  ERN_TRANSFORMER_CACHE_DIRECTORY
)

export default async function getTransformer(
  transformer: PackagePath
): Promise<ContainerTransformer> {
  return transformerFactory.getModuleInstance(transformer)
}
