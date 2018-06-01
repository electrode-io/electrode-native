import { PackagePath, Platform, shell, yarn } from 'ern-core'
import { ContainerPublisher } from './types'
import fs from 'fs'
import path from 'path'

const ERN_PUBLISHER_PACKAGE_PREFIX = 'ern-container-publisher-'
const REGISTRY_PATH_VERSION_RE = new RegExp(/^(.+)@(.+)$/)

export default async function getPublisher(
  publisher: string
): Promise<ContainerPublisher> {
  let pathToPublisherEntry
  if (fs.existsSync(publisher)) {
    const pathWithSrc = path.join(publisher, 'src')
    pathToPublisherEntry = fs.existsSync(pathWithSrc) ? pathWithSrc : publisher
  } else {
    try {
      shell.pushd(Platform.containerPublishersCacheDirectory)
      if (
        !publisher.startsWith('@') &&
        !publisher.startsWith(ERN_PUBLISHER_PACKAGE_PREFIX)
      ) {
        publisher = `${ERN_PUBLISHER_PACKAGE_PREFIX}${publisher}`
      }
      await yarn.add(PackagePath.fromString(publisher))
      const pkgName = REGISTRY_PATH_VERSION_RE.test(publisher)
        ? REGISTRY_PATH_VERSION_RE.exec(publisher)![1]
        : publisher
      pathToPublisherEntry = path.join(
        Platform.containerPublishersCacheDirectory,
        'node_modules',
        pkgName
      )
    } finally {
      shell.popd()
    }
  }

  const Publisher = require(pathToPublisherEntry).default
  return new Publisher()
}
