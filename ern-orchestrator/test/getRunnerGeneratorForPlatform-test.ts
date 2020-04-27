import { expect } from 'chai';
import { AndroidRunnerGenerator } from 'ern-runner-gen-android';
import { IosRunnerGenerator } from 'ern-runner-gen-ios';
import { getRunnerGeneratorForPlatform } from '../src/getRunnerGeneratorForPlatform';

describe('getRunnerGeneratorForPlatform', () => {
  it('should return an AndroidRunnerGenerator instance for android platform', () => {
    expect(getRunnerGeneratorForPlatform('android')).instanceof(
      AndroidRunnerGenerator,
    );
  });

  it('should return an IosRunnerGenerator instance for ios platfom', () => {
    expect(getRunnerGeneratorForPlatform('ios')).instanceof(IosRunnerGenerator);
  });

  it('should throw if platform is not supported', () => {
    expect(() => getRunnerGeneratorForPlatform('atari')).to.throw();
  });
});
