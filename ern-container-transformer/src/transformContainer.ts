import { ContainerTransformerConfig } from './types'
import getTransformer from './getTransformer'
import { createTmpDir, shell, Platform, yarn } from 'ern-core'
import fs from 'fs'
import path from 'path'

export default async function transformContainer(
  conf: ContainerTransformerConfig
) {
  conf.ernVersion = Platform.currentVersion

  if (!fs.existsSync(Platform.containerTransformersCacheDirectory)) {
    shell.mkdir('-p', Platform.containerTransformersCacheDirectory)
    try {
      shell.pushd(Platform.containerTransformersCacheDirectory)
      await yarn.init()
    } finally {
      shell.popd()
    }
  }

  const transformer = await getTransformer(conf.transformer)

  if (!transformer.platforms.includes(conf.platform)) {
    throw new Error(
      `The ${transformer.name} transformer does not support transformation of ${
        conf.platform
      } Containers`
    )
  }
  return transformer.transform(conf)
}
