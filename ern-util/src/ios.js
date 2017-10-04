// @flow

import _ from 'lodash'
import inquirer from 'inquirer'
import simctl from 'node-simctl'
import {
  execSync,
  spawn
} from 'child_process'

export async function getiPhoneDevices () {
  const iosDevices = await simctl.getDevices()
  return _.filter(
           _.flattenDeep(
             _.map(iosDevices, (val, key) => val)),
        (device) => device.name.match(/^iPhone/))
}

export async function askUserToSelectAniPhoneDevice () {
  const iPhoneDecices = await getiPhoneDevices()
  const choices = _.map(iPhoneDecices, (val, key) => ({
    name: `${val.name} (UDID ${val.udid})`,
    value: val
  }))

  const { selectedDevice } = await inquirer.prompt([{
    type: 'list',
    name: 'device',
    message: 'Choose an iOS simulator',
    choices
  }])

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

export async function installApplicationOnDevice (deviceUdid: string, pathToAppFile: string) {
  return simctl.installApp(deviceUdid, pathToAppFile)
}

export async function launchApplication (deviceUdid: string, bundleId: string) {
  return simctl.launch(deviceUdid, bundleId)
}
