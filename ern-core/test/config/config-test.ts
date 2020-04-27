import { resolveLocalErnRc } from '../../src/config';
import createTmpDir from '../../src/createTmpDir';
import { expect } from 'chai';
import fs from 'fs-extra';
import path from 'path';

describe('resolveLocalErnRc', () => {
  it('should return current directory if it contains a .ernrc', () => {
    const tmpDir = createTmpDir();
    const pathToErnRc = path.join(tmpDir, '.ernrc');
    fs.writeFileSync(pathToErnRc, '{}');
    expect(resolveLocalErnRc(tmpDir)).eql(pathToErnRc);
  });

  it('should bubble up parent directory chain until it finds a .ernrc ', () => {
    const tmpDir = createTmpDir();
    const nestedDir = path.join(tmpDir, 'a/b/c');
    const pathToErnRc = path.join(tmpDir, 'a', '.ernrc');
    fs.mkdirpSync(nestedDir);
    fs.writeFileSync(pathToErnRc, '{}');
    expect(resolveLocalErnRc(nestedDir)).eql(pathToErnRc);
  });
});
