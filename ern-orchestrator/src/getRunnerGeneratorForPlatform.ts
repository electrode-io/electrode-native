import { RunnerGenerator } from 'ern-runner-gen';
import { AndroidRunnerGenerator } from 'ern-runner-gen-android';
import { IosRunnerGenerator } from 'ern-runner-gen-ios';

export function getRunnerGeneratorForPlatform(
  platform: string,
): RunnerGenerator {
  switch (platform) {
    case 'android':
      return new AndroidRunnerGenerator();
    case 'ios':
      return new IosRunnerGenerator();
    default:
      throw new Error(`Unsupported platform : ${platform}`);
  }
}
