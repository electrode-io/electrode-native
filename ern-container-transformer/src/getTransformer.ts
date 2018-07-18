import { PackagePath, Platform, shell, yarn, readPackageJson } from 'ern-core'
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
      const transformerPackagePath = PackagePath.fromString(transformer)
      const packageJson = await readPackageJson(
        Platform.containerTransformersCacheDirectory
      )
      if (
        packageJson.dependencies &&
        packageJson.dependencies[transformerPackagePath.basePath]
      ) {
        await yarn.upgrade(transformerPackagePath)
      } else {
        await yarn.add(transformerPackagePath)
      }
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
