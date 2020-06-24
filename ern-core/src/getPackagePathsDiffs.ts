import { PackagePath } from './PackagePath';
import _ from 'lodash';

export function getPackagePathsDiffs(a: PackagePath[], b: PackagePath[]) {
  return {
    // In a but not in b
    added: _.differenceBy(a, b, 'basePath'),
    // In b but not in a
    removed: _.differenceBy(b, a, 'basePath'),
    // Different version in a v.s b
    updated: _.differenceWith(
      a,
      b,
      (aVal: PackagePath, bVal: PackagePath) =>
        aVal.basePath === bVal.basePath && aVal.version !== bVal.version,
    ),
  };
}
