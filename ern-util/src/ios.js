// @flow

import _ from 'lodash'
import inquirer from 'inquirer'
import {
  execSync,
  spawn
} from 'child_process'
import spin from './spin'
import ernConfig from './config'
const simctl = require('node-simctl')

export type IosDevice = {
  name: string;
  udid: string;
  version: string;
}

export async function getiPhoneSimulators () {
  const iosSims = await simctl.getDevices()
  return _.filter(
           _.flattenDeep(
             _.map(iosSims, (val, key) => val)),
        (device) => device.name.match(/^iPhone/))
}

export function getiPhoneRealDevices () {
  const devices = execSync('xcrun instruments -s', {encoding: 'utf8'})
  const computerName = execSync('scutil --get HostName', {encoding: 'utf8'})
  return parseIOSDevicesList(devices, computerName)
}

export async function askUserToSelectAniPhoneDevice (devices: Array<IosDevice>) {
  const choices = _.map(devices, (val, key) => ({
    name: `${val.name} udid: ${val.udid} version: ${val.version}`,
    value: val
  }))

  const { selectedDevice } = await inquirer.prompt([{
    type: 'list',
    name: 'selectedDevice',
    message: 'Choose an iOS device',
    choices: choices
  }])

  return selectedDevice
}

export async function askUserToSelectAniPhoneSimulator () {
  const iPhoneDevices = await getiPhoneSimulators()
  const choices = _.map(iPhoneDevices, (val, key) => ({
    name: `${val.name} (UDID ${val.udid})`,
    value: val
  }))

  // Check if user has set the usePreviousEmulator flag to true
  let emulatorConfig = ernConfig.getValue('emulatorConfig')
  if (choices && emulatorConfig.ios.usePreviousEmulator) {
    // Get the name of previously used simulator
    const simulatorUdid = emulatorConfig.ios.simulatorUdid
    // Check if simulator still exists
    let previousSimulator
    choices.forEach((val) => {
      if (val && val.value.udid === simulatorUdid) {
        previousSimulator = val.value
      }
    })
    if (previousSimulator) {
      return previousSimulator
    }
  }

  // if simulator is still not resolved
  let {selectedDevice} = await inquirer.prompt([{
    type: 'list',
    name: 'selectedDevice',
    message: 'Choose an iOS simulator',
    choices
  }])

  // Update the emulatorConfig
  emulatorConfig.ios.simulatorUdid = selectedDevice.udid
  ernConfig.setValue('emulatorConfig', emulatorConfig)

  return selectedDevice
}

export function parseIOSDevicesList (text: string, computerName: string): Array<IosDevice> {
  const name = computerName.split('\n')[0]
  const devicePattern = /(.*?) \((.*?)\) \[(.*?)\]/
  const noSimulatorPattern = /(.*?) \((.*?)\) \[(.*?)\] \((.*?)\)/

  return text.split('\n').reduce((list, line) => {
    const device = line.match(devicePattern)
    if (
      device &&
      !noSimulatorPattern.test(line) &&
      !line.includes(name)
    ) {
      list.push({
        name: device[1],
        version: device[2],
        udid: device[3]
      })
    }

    return list
  }, [])
}

export function killAllRunningSimulators () {
  try {
    execSync(`killall "Simulator" `)
  } catch (e) {
    // do nothing if there is no simulator launched
  }
}

export async function launchSimulator (deviceUdid: string) {
  return new Promise((resolve, reject) => {
    const xcrunProc = spawn('xcrun', [ 'instruments', '-w', deviceUdid ])
    xcrunProc.stdout.on('data', data => {
      log.debug(data)
    })
    xcrunProc.stderr.on('data', data => {
      log.debug(data)
    })
    xcrunProc.on('close', code => {
      code === (0 || 255 /* 255 code because we don't provide -t option */)
        ? resolve()
        : reject(new Error(`XCode xcrun command failed with exit code ${code}`))
    })
  })
}

export async function runIosApp ({
  appPath,
  bundleId
  } : {
    appPath: string,
    bundleId: string
    }) {
  const iPhoneDevice = await askUserToSelectAniPhoneSimulator()
  killAllRunningSimulators()
  await spin('Waiting for device to boot',
    launchSimulator(iPhoneDevice.udid))
  await spin('Installing application on simulator',
    installApplicationOnSimulator(iPhoneDevice.udid, appPath))
  await spin('Launching application',
    launchApplication(iPhoneDevice.udid, bundleId))
}

export async function installApplicationOnSimulator (deviceUdid: string, pathToAppFile: string) {
  return simctl.installApp(deviceUdid, pathToAppFile)
}

export async function launchApplication (deviceUdid: string, bundleId: string) {
  return simctl.launch(deviceUdid, bundleId)
}
