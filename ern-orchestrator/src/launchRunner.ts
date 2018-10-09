import { android, ios } from 'ern-core'
import { launchOnDevice } from './launchOnDevice'
import { launchOnSimulator } from './launchOnSimulator'

const { runAndroidProject } = android

export async function launchRunner({
  platform,
  pathToRunner,
  host,
  port,
}: {
  platform: string
  pathToRunner: string
  host?: string
  port?: string
}) {
  if (platform === 'android') {
    return launchAndroidRunner(pathToRunner)
  } else if (platform === 'ios') {
    return launchIosRunner(pathToRunner)
  }
}

async function launchAndroidRunner(pathToAndroidRunner: string) {
  return runAndroidProject({
    packageName: 'com.walmartlabs.ern',
    projectPath: pathToAndroidRunner,
  })
}

async function launchIosRunner(pathToIosRunner: string) {
  const iosDevices = ios.getiPhoneRealDevices()
  if (iosDevices && iosDevices.length > 0) {
    launchOnDevice(pathToIosRunner, iosDevices)
  } else {
    launchOnSimulator(pathToIosRunner)
  }
}
