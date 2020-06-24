import { ContainerTransformerConfig } from './types';
import getTransformer from './getTransformer';
import { Platform } from 'ern-core';

export default async function transformContainer(
  conf: ContainerTransformerConfig,
) {
  conf.ernVersion = Platform.currentVersion;

  const transformer = await getTransformer(conf.transformer);

  if (!transformer.platforms.includes(conf.platform)) {
    throw new Error(
      `The ${transformer.name} transformer does not support transformation of ${conf.platform} Containers`,
    );
  }
  return transformer.transform(conf);
}
