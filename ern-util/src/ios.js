// @flow

import _ from 'lodash'
import inquirer from 'inquirer'
import {
  execSync,
  spawn
} from 'child_process'
import spin from './spin'
import ernConfig from '../../ern-core/src/config'
import os from 'os'
import { constants } from 'ern-core'

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

function getKnownDevices () {
  return execSync('xcrun instruments -s', {encoding: 'utf8'})
}

function getComputerName () {
  return os.hostname()
}

exports.getKnownDevices = getKnownDevices
exports.getComputerName = getComputerName

export function getiPhoneRealDevices () {
  const devices = exports.getKnownDevices()
  const computerName = exports.getComputerName()
  return parseIOSDevicesList(devices, computerName)
}

export async function askUserToSelectAniPhoneDevice (devices: Array<IosDevice>) {
  const choices = _.map(devices, (val, key) => ({
    name: `${val.name} udid: ${val.udid} version: ${val.version}`,
    value: val
  }))

  const {selectedDevice} = await inquirer.prompt([{
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
  let deviceConfig = ernConfig.getValue(constants.IOS_DEVICE_CONFIG)
  if (choices && deviceConfig) {
    if (deviceConfig.usePreviousDevice) {
      // Get the name of previously used simulator
      const deviceUdid = deviceConfig.deviceId
      // Check if simulator still exists
      let previousDevice
      choices.forEach((val) => {
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
  let {selectedDevice} = await inquirer.prompt([{
    type: 'list',
    name: 'selectedDevice',
    message: 'Choose an iOS device',
    choices
  }])

  // Update the emulatorConfig
  deviceConfig.deviceId = selectedDevice.udid
  ernConfig.setValue(constants.IOS_DEVICE_CONFIG, deviceConfig)

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
    const xcrunProc = spawn('xcrun', ['instruments', '-w', deviceUdid])
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
                                 }: {
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
