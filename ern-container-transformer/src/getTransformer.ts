import { PackagePath, Platform, shell, yarn } from 'ern-core'
import { ContainerTransformer } from './types'
import fs from 'fs'
import path from 'path'

const ERN_TRANSFORMER_PACKAGE_PREFIX = 'ern-container-transformer-'
const REGISTRY_PATH_VERSION_RE = new RegExp(/^(.+)@(.+)$/)

export default async function getTransformer(
  transformer: string
): Promise<ContainerTransformer> {
  let pathToTransformerEntry
  if (fs.existsSync(transformer)) {
    const pathWithSrc = path.join(transformer, 'src')
    pathToTransformerEntry = fs.existsSync(pathWithSrc)
      ? pathWithSrc
      : transformer
  } else {
    try {
      shell.pushd(Platform.containerTransformersCacheDirectory)
      if (
        !transformer.startsWith('@') &&
        !transformer.startsWith(ERN_TRANSFORMER_PACKAGE_PREFIX)
      ) {
        transformer = `${ERN_TRANSFORMER_PACKAGE_PREFIX}${transformer}`
      }
      await yarn.add(PackagePath.fromString(transformer))
      const pkgName = REGISTRY_PATH_VERSION_RE.test(transformer)
        ? REGISTRY_PATH_VERSION_RE.exec(transformer)![1]
        : transformer
      pathToTransformerEntry = path.join(
        Platform.containerTransformersCacheDirectory,
        'node_modules',
        pkgName
      )
    } finally {
      shell.popd()
    }
  }

  const Transformer = require(pathToTransformerEntry).default
  return new Transformer()
}
