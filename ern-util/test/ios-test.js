import {
  assert,
  expect,
} from 'chai'
import fs from 'fs'
import path from 'path'
import Promise from 'bluebird'
import * as ios from '../src/ios.js'
import * as childProcess from 'child_process'
import sinon from 'sinon'
import inquirer from 'inquirer'
import * as fixtures from './fixtures/common'
import ernConfig from '../src/config'

const simctl = require('node-simctl')

const computerName = 'Funny MacBook Pro (47)\n'
// util.promisify function added to the core only after node 8
const readFile = Promise.promisify(fs.readFile)
const iPhoneSimulatorsWithNoIphone = require('./fixtures/ios_no_iphone_simulators.json')
const iPhoneSimulators = require('./fixtures/ios_iphone_simulators.json')

// Logging stubs
const logErrorStub = sinon.stub()
const logInfoStub = sinon.stub()
const logDebugStub = sinon.stub()
const logTraceStub = sinon.stub()

global.log = {
  error: logErrorStub,
  info: logInfoStub,
  debug: logDebugStub,
  trace: logTraceStub
}

// test stubs
const getDevicesStub = sinon.stub(simctl, 'getDevices')
const getKnownDevicesStub = sinon.stub(ios, 'getKnownDevices')
const getComputerNameStub = sinon.stub(ios, 'getComputerName')
let ernConfigStub

beforeEach(() => {
  getDevicesStub.reset()
})

afterEach(() => {
  ernConfigStub && ernConfigStub.restore()
})

after(() => {
  getDevicesStub.restore()
  getKnownDevicesStub.restore()
})

function resolveGetDevices (fixtures) {
  getDevicesStub.resolves(fixtures)
}

describe('ios utils', () => {
  describe('getiPhoneSimulators', () => {
    it('should return empty list with no matching iphone', async () => {
      resolveGetDevices(iPhoneSimulatorsWithNoIphone)
      expect(await ios.getiPhoneSimulators()).to.be.empty
    })

    it('should return list with matching iphone', async () => {
      resolveGetDevices(iPhoneSimulators)
      expect(await ios.getiPhoneSimulators()).to.be.length(11)
    })
  })

  describe('getiPhoneRealDevices', () => {
    it('should return empty list for no real iPhone device', async () => {
      const instruments = await readFile(
        path.resolve(__dirname, './fixtures/instruments.txt'),
        {encoding: 'utf8'}
      )
      getKnownDevicesStub.returns(instruments)
      getComputerNameStub.returns(computerName)
      expect(ios.getiPhoneRealDevices(instruments, computerName)).to.be.empty
    })

    it('should return real iPhone device', async () => {
      const instruments = await readFile(
        path.resolve(__dirname, './fixtures/instruments-with-device.txt'),
        {encoding: 'utf8'}
      )
      getKnownDevicesStub.returns(instruments)
      getComputerNameStub.returns(computerName)
      expect(
        ios.getiPhoneRealDevices()
      ).to.deep.equal([{
        name: 'Hilarious Phone Name',
        udid: '695c329443f455c75b5454aacb72ace87b66351e',
        version: '11.1'
      }])
    })
  })

  describe('getKnownDevices', () => {
    it('should return known devices', () => {
      getKnownDevicesStub.restore()
      expect(ios.getKnownDevices()).to.have.length.above(1)
    }).timeout(4000) //Error: Timeout of 2000ms exceeded [mocha default]
  })

  describe('getComputerName', () => {
    it('should return computer name', () => {
      getComputerNameStub.restore()
      expect(ios.getComputerName()).to.have.length.above(1)
    })
  })

  describe('askUserToSelectAniPhoneDevice', () => {
    it('prompt user to select iPhone Device', async () => {
      const deviceList = [
        {
          name: 'iPhone 5s',
          udid: 'CEF8F618-82F3-4BE5-A2B6-92A96F83687A',
          version: '11.1'
        },
        {
          name: 'iPhone 5s',
          udid: 'CEF8F618-82F3-4BE5-A2B6-92A96F83687A',
          version: '11.1'
        }]
      const inquirerIosStub = sinon.stub(inquirer, 'prompt').resolves(
        {
          selectedDevice: {
            name: 'iPhone 5s',
            udid: 'CEF8F618-82F3-4BE5-A2B6-92A96F83687A',
            version: '11.1'
          }
        })
      const result = await ios.askUserToSelectAniPhoneDevice(deviceList)
      inquirerIosStub.restore()
      expect(result).to.deep.equal({
        name: 'iPhone 5s',
        udid: 'CEF8F618-82F3-4BE5-A2B6-92A96F83687A',
        version: '11.1'
      })
    })
  })

  describe('askUserToSelectAniPhoneSimulator', () => {
    it('prompt user to select iPhone Simulator if usePreviousEmulator is false', async () => {
      resolveGetDevices(iPhoneSimulators)
      const config = {
        usePreviousDevice: false,
        deviceId: fixtures.oneUdid
      }
      ernConfigStub = sinon.stub(ernConfig, 'getValue').returns(config)
      const inquirerIosStub = sinon.stub(inquirer, 'prompt').resolves(
        {
          selectedDevice: {
            name: 'iPhone 5s',
            udid: 'CEF8F618-82F3-4BE5-A2B6-92A96F83687A',
            version: '11.1'
          }
        })
      const result = await ios.askUserToSelectAniPhoneSimulator()
      inquirerIosStub.restore()
      expect(result).to.deep.equal({
        name: 'iPhone 5s',
        udid: 'CEF8F618-82F3-4BE5-A2B6-92A96F83687A',
        version: '11.1'
      })
    })

    it('prompt user if simulator is missing and previous emulator flag is true ', async () => {
      resolveGetDevices(iPhoneSimulators)
      const config = {
        usePreviousDevice: true,
        deviceId: 'SimulatorNotPresent'
      }
      ernConfigStub = sinon.stub(ernConfig, 'getValue').returns(config)
      const inquirerIosStub = sinon.stub(inquirer, 'prompt').resolves(
        {
          selectedDevice: {
            name: 'iPhone 5s',
            udid: 'CEF8F618-82F3-4BE5-A2B6-92A96F83687A',
            version: '11.1'
          }
        })
      const result = await ios.askUserToSelectAniPhoneSimulator()
      inquirerIosStub.restore()
      expect(result).to.deep.equal({
        name: 'iPhone 5s',
        udid: 'CEF8F618-82F3-4BE5-A2B6-92A96F83687A',
        version: '11.1'
      })
    })

    it('do not prompt user to select iPhone Simulator if usePreviousEmulator is true', async () => {
      resolveGetDevices(iPhoneSimulators)
      const config = {
        usePreviousDevice: true,
        deviceId: fixtures.oneUdid
      }
      ernConfigStub = sinon.stub(ernConfig, 'getValue').returns(config)
      const result = await ios.askUserToSelectAniPhoneSimulator()
      expect(result.udid).to.eql(fixtures.oneUdid)
    })
  })

  describe('parse iOS device list', () => {
    it('should return empty list without device', async () => {
      const instruments = await readFile(
        path.resolve(__dirname, './fixtures/instruments.txt'),
        {encoding: 'utf8'}
      )
      expect(ios.parseIOSDevicesList(instruments, computerName)).to.be.empty
    })
    it('should return item with device', async () => {
      const instrumentsWithDevice = await readFile(
        path.resolve(__dirname, './fixtures/instruments-with-device.txt'),
        {encoding: 'utf8'}
      )
      expect(
        ios.parseIOSDevicesList(instrumentsWithDevice, computerName)
      ).to.deep.equal([{
        name: 'Hilarious Phone Name',
        udid: '695c329443f455c75b5454aacb72ace87b66351e',
        version: '11.1'
      }])
    })
  })
})
