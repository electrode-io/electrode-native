import { expect } from 'chai';
import { AndroidGenerator } from 'ern-container-gen-android';
import { shell, createTmpDir } from 'ern-core';
import path from 'path';

describe('Test - Convert files in the directory to AndroidX Imports Logic', () => {
  const tmpDir = createTmpDir();
  const fixturesPath = path.join(__dirname, 'fixtures');

  shell.cp('-rf', fixturesPath, tmpDir);

  it('convert files in directory to AndroidX', () => {
    expect(new AndroidGenerator().convertToAndroidX(tmpDir)).to.eq(2);
  });

  it('returns files in directory which contains existing AndroidX plugins', () => {
    expect(new AndroidGenerator().convertToAndroidX(tmpDir)).to.eq(0);
  });
});
