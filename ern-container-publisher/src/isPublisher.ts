import { PackagePath } from 'ern-core';

const ERN_PUBLISHER_PACKAGE_PREFIX = 'ern-container-publisher-';

export default function isPublisher(p: PackagePath): boolean {
  return p.basePath.includes(ERN_PUBLISHER_PACKAGE_PREFIX);
}
