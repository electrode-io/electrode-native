import { android, ios } from 'ern-core'
import { launchOnDevice } from './launchOnDevice'
import { launchOnSimulator } from './launchOnSimulator'
import { LaunchRunnerConfig } from 'ern-runner-gen/src/types/LaunchRunnerConfig'

export async function launchRunner(config: LaunchRunnerConfig) {
  if (config.platform === 'android') {
    return launchAndroidRunner(config)
  } else if (config.platform === 'ios') {
    return launchIosRunner(config)
  }
}

async function launchAndroidRunner(config: LaunchRunnerConfig) {
  return android.runAndroidProject({
    packageName: config.extra.packageName,
    projectPath: config.pathToRunner,
  })
}

async function launchIosRunner(config: LaunchRunnerConfig) {
  const iosDevices = ios.getiPhoneRealDevices()
  return iosDevices && iosDevices.length > 0
    ? launchOnDevice(config.pathToRunner, iosDevices)
    : launchOnSimulator(config.pathToRunner)
}
