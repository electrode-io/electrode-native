import _ from 'lodash'
import inquirer from 'inquirer'
import { execSync, spawn } from 'child_process'
import { spawnp } from './childProcess'
import ernConfig from './config'
import * as deviceConfigUtil from './deviceConfig'
import log from './log'
import os from 'os'
import simctl = require('node-simctl')
import kax from './kax'

export interface IosDevice {
  name: string
  udid: string
  version: string
}

export async function getiPhoneSimulators(): Promise<any> {
  const iosSims = await simctl.getDevices()
  return _.filter(_.flattenDeep(_.map(iosSims, (val, key) => val)), device =>
    device.name.match(/^iPhone/)
  )
}

export function getKnownDevices(): string {
  return execSync('xcrun instruments -s', { encoding: 'utf8' })
}

export function getComputerName(): string {
  return os.hostname()
}

export function getiPhoneRealDevices() {
  const devices = getKnownDevices()
  const computerName = getComputerName()
  return parseIOSDevicesList(devices, computerName)
}

export async function askUserToSelectAniPhoneDevice(devices: IosDevice[]) {
  const choices = _.map(devices, (val, key) => ({
    name: `${val.name} udid: ${val.udid} version: ${val.version}`,
    value: val,
  }))

  const { selectedDevice } = await inquirer.prompt([
    <inquirer.Question>{
      choices,
      message: 'Choose an iOS device',
      name: 'selectedDevice',
      type: 'list',
    },
  ])

  return selectedDevice
}

export async function askUserToSelectAniPhoneSimulator() {
  const iPhoneDevices = await getiPhoneSimulators()
  const choices = _.map(iPhoneDevices, (val, key) => ({
    name: `${val.name} (UDID ${val.udid})`,
    value: val,
  }))

  // Check if user has set the usePreviousEmulator flag to true
  const deviceConfig = ernConfig.getValue(deviceConfigUtil.IOS_DEVICE_CONFIG)
  if (choices && deviceConfig) {
    if (deviceConfig.usePreviousDevice) {
      // Get the name of previously used simulator
      const deviceUdid = deviceConfig.deviceId
      // Check if simulator still exists
      let previousDevice
      choices.forEach(val => {
        if (val && val.value.udid === deviceUdid) {
          previousDevice = val.value
        }
      })
      if (previousDevice) {
        return previousDevice
      }
    }
  }

  // if simulator is still not resolved
  const { selectedDevice } = await inquirer.prompt([
    <inquirer.Question>{
      choices,
      message: 'Choose an iOS device',
      name: 'selectedDevice',
      type: 'list',
    },
  ])

  // Update the emulatorConfig
  deviceConfig.deviceId = selectedDevice.udid
  ernConfig.setValue(deviceConfigUtil.IOS_DEVICE_CONFIG, deviceConfig)

  return selectedDevice
}

export function parseIOSDevicesList(
  text: string,
  computerName: string
): IosDevice[] {
  const name = computerName.split('\n')[0]
  const devicePattern = /(.*?) \((.*?)\) \[(.*?)\]/
  const noSimulatorPattern = /(.*?) \((.*?)\) \[(.*?)\] \((.*?)\)/

  return text.split('\n').reduce((list: any, line: string) => {
    const device = line.match(devicePattern)
    if (
      device &&
      !noSimulatorPattern.test(line) &&
      !line.includes(name) &&
      !line.includes('MacBook')
    ) {
      list.push({
        name: device[1],
        udid: device[3],
        version: device[2],
      })
    }

    return list
  }, [])
}

export function killAllRunningSimulators() {
  try {
    execSync(`killall "Simulator" `)
  } catch (e) {
    // do nothing if there is no simulator launched
  }
}

export async function launchSimulator(deviceUdid: string) {
  return new Promise((resolve, reject) => {
    const xcrunProc = spawn('xcrun', ['instruments', '-w', deviceUdid])
    xcrunProc.stdout.on('data', data => {
      log.debug(data.toString())
    })
    xcrunProc.stderr.on('data', data => {
      log.debug(data.toString())
    })
    xcrunProc.on('close', code => {
      code === (0 || 255) /* 255 code because we don't provide -t option */
        ? resolve()
        : reject(new Error(`XCode xcrun command failed with exit code ${code}`))
    })
  })
}

export async function runIosApp({
  appPath,
  bundleId,
  launchArgs,
  launchEnvVars,
}: {
  appPath: string
  bundleId: string
  launchArgs?: string
  launchEnvVars?: string
}) {
  const iPhoneDevice = await askUserToSelectAniPhoneSimulator()
  killAllRunningSimulators()
  await kax
    .task('Waiting for device to boot')
    .run(launchSimulator(iPhoneDevice.udid))
  await kax
    .task('Installing application on simulator')
    .run(installApplicationOnSimulator(iPhoneDevice.udid, appPath))
  await kax.task('Launching application').run(
    launchApplication(iPhoneDevice.udid, bundleId, {
      launchArgs,
      launchEnvVars,
    })
  )
}

export async function installApplicationOnSimulator(
  deviceUdid: string,
  pathToAppFile: string
) {
  return simctl.installApp(deviceUdid, pathToAppFile)
}

export async function launchApplication(
  deviceUdid: string,
  bundleId: string,
  {
    launchArgs = '',
    launchEnvVars = '',
  }: { launchArgs?: string; launchEnvVars?: string } = {}
) {
  // Prefix all provided env variables with 'SIMCTL_CHILD_
  // As described by running `xcrun simctl launch --help` :
  //    "If you want to set environment variables in the resulting environment,
  //     set them in the calling environment with a SIMCTL_CHILD_ prefix."
  launchEnvVars
    .split(' ')
    .map(x => x.split('='))
    .forEach(([k, v]) => {
      process.env[`SIMCTL_CHILD_${k}`] = v
    })

  return spawnp('xcrun', [
    'simctl',
    'launch',
    deviceUdid,
    bundleId,
    ...launchArgs.split(' '),
  ])
}
