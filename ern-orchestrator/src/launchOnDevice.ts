import { ios, kax, shell } from 'ern-core'
import { buildIosRunner } from './buildIosRunner'
import { spawnSync } from 'child_process'

export async function launchOnDevice(
  pathToIosRunner: string,
  devices,
  {
    launchArgs,
    launchEnvVars,
  }: { launchArgs?: string; launchEnvVars?: string } = {}
) {
  const iPhoneDevice = await ios.askUserToSelectAniPhoneDevice(devices)
  shell.pushd(pathToIosRunner)

  try {
    await kax
      .task('Building iOS Runner project')
      .run(buildIosRunner(pathToIosRunner, iPhoneDevice.udid))

    const kaxDeployTask = kax.task(
      `Installing iOS Runner on ${iPhoneDevice.name}`
    )
    try {
      const iosDeployInstallArgs = [
        '--bundle',
        `${pathToIosRunner}/build/Debug-iphoneos/ErnRunner.app`,
        '--id',
        iPhoneDevice.udid,
        '--justlaunch',
      ]
      if (launchArgs) {
        iosDeployInstallArgs.push('--args')
        iosDeployInstallArgs.push(launchArgs.split(' '))
      }
      if (launchEnvVars) {
        iosDeployInstallArgs.push('--envs')
        iosDeployInstallArgs.push(launchEnvVars.split(' '))
      }
      const iosDeployOutput = spawnSync('ios-deploy', iosDeployInstallArgs, {
        encoding: 'utf8',
      })
      if (iosDeployOutput.error) {
        kaxDeployTask.fail(
          `Installation failed. Make sure you have run 'npm install -g ios-deploy'.`
        )
      } else {
        kaxDeployTask.succeed()
      }
    } catch (e) {
      kaxDeployTask.fail(e.message)
      throw e
    }
  } finally {
    shell.popd()
  }
}
