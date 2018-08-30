import { ModuleFactory, Platform, PackagePath } from 'ern-core'
import { ContainerPublisher } from './types'

const ERN_PUBLISHER_PACKAGE_PREFIX = 'ern-container-publisher-'
const ERN_PUBLISHER_CACHE_DIRECTORY = Platform.containerPublishersCacheDirectory

const transformerFactory = new ModuleFactory<ContainerPublisher>(
  ERN_PUBLISHER_PACKAGE_PREFIX,
  ERN_PUBLISHER_CACHE_DIRECTORY
)

export default async function getPublisher(
  publisher: string
): Promise<ContainerPublisher> {
  return transformerFactory.getModuleInstance(PackagePath.fromString(publisher))
}
