// tslint:disable:object-literal-sort-keys

import { sortObjectByKeys } from '../src/sortObjectByKeys';
import { expect } from 'chai';

describe('sortObjectByKey', () => {
  it('should sort an object by its keys', () => {
    const obj = {
      c: 1,
      a: 2,
      b: 3,
    };
    const sortedObj = sortObjectByKeys(obj);
    expect(Object.keys(sortedObj)).deep.equal(['a', 'b', 'c']);
    expect(obj).deep.equal(sortedObj);
  });
});
