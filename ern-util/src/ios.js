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

export async function getiPhoneDevices () {
  const iosDevices = await simctl.getDevices()
  return _.filter(
    _.flattenDeep(
      _.map(iosDevices, (val, key) => val)),
    (device) => device.name.match(/^iPhone/))
}

export async function askUserToSelectAniPhoneDevice () {
  const iPhoneDevices = await getiPhoneDevices()
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
  const iPhoneDevice = await askUserToSelectAniPhoneDevice()
  killAllRunningSimulators()
  await spin('Waiting for device to boot',
    launchSimulator(iPhoneDevice.udid))
  await spin('Installing application on simulator',
    installApplicationOnDevice(iPhoneDevice.udid, appPath))
  await spin('Launching application',
    launchApplication(iPhoneDevice.udid, bundleId))
}

export async function installApplicationOnDevice (deviceUdid: string, pathToAppFile: string) {
  return simctl.installApp(deviceUdid, pathToAppFile)
}

export async function launchApplication (deviceUdid: string, bundleId: string) {
  return simctl.launch(deviceUdid, bundleId)
}
