import _ from 'lodash';

export function normalizeVersionsToSemver(versions: string[]): string[] {
  const validSemVerRe = /^\d+\.\d+.\d+.*/;
  const versionMissingPatchRe = /^(\d+\.\d+)(.*)/;
  const versionMissingMinorRe = /^(\d+)(.*)/;
  return _.map(versions, v => {
    if (validSemVerRe.test(v)) {
      return v;
    } else {
      if (versionMissingPatchRe.test(v)) {
        return v.replace(versionMissingPatchRe, '$1.0$2');
      } else if (versionMissingMinorRe.test(v)) {
        return v.replace(versionMissingMinorRe, '$1.0.0$2');
      }
      throw new Error(`${v} is not a valid version`);
    }
  });
}
