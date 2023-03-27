import { expect } from 'chai';
import { AndroidGenerator } from 'ern-container-gen-android';

describe('Test Convert to AndroidX Imports Logic', () => {
  it('Expect files in directory to be converted to AndroidX', () => {
    expect(new AndroidGenerator().convertToAndroidX('fixtures')).to.eq(2);
  });

  it('Return 0 files converting the existing AndroidX plugins above', () => {
    expect(new AndroidGenerator().convertToAndroidX('fixtures')).to.eq(0);
  });
});
