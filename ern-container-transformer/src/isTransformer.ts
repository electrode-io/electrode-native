import { PackagePath } from 'ern-core';

const ERN_TRANSFORMER_PACKAGE_PREFIX = 'ern-container-transformer-';

export default function isTransformer(p: PackagePath): boolean {
  return p.basePath.includes(ERN_TRANSFORMER_PACKAGE_PREFIX);
}
