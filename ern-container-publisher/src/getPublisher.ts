import { ModuleFactory, PackagePath, Platform } from 'ern-core'
import { ContainerPublisher } from './types'

const ERN_PUBLISHER_CACHE_DIRECTORY = Platform.containerPublishersCacheDirectory

const transformerFactory = new ModuleFactory<ContainerPublisher>(
  ERN_PUBLISHER_CACHE_DIRECTORY
)

export default async function getPublisher(
  publisher: PackagePath
): Promise<ContainerPublisher> {
  return transformerFactory.getModuleInstance(publisher)
}
