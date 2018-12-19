import AndroidRunnerGenerator from '../../src/AndroidRunnerGenerator'
import { NativePlatform } from 'ern-core'

export default async function generateFixtures(
  mainMiniAppName: string,
  outDir: string,
  targetPlatform: NativePlatform
): Promise<void> {
  const androidGenerator = new AndroidRunnerGenerator()
  await androidGenerator.generate({
    mainMiniAppName,
    outDir,
    targetPlatform,
  })
}
