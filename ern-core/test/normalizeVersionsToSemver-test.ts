import { expect } from 'chai';
import { normalizeVersionsToSemver } from '../src/normalizeVersionsToSemver';

describe('normalizeVersionsToSemver', () => {
  it('should return an array containing the normalized versions', () => {
    const versions = ['1.0.0', '2.0', '3', '1.0.0-beta', '2.0-beta', '2-beta'];
    const result = normalizeVersionsToSemver(versions);
    expect(result)
      .to.be.an('array')
      .deep.equal([
        '1.0.0',
        '2.0.0',
        '3.0.0',
        '1.0.0-beta',
        '2.0.0-beta',
        '2.0.0-beta',
      ]);
  });
});
