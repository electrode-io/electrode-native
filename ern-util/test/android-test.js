import {
  assert,
  expect,
} from 'chai'
import fs from 'fs'
import Promise from 'bluebird'
import path from 'path'
import * as childProcess from '../src/childProcess'
import sinon from 'sinon'
import ora from 'ora'
import  {
  getAndroidAvds,
  askUserToSelectAvdEmulator,
  getDevices,
  runAndroid,
  installAndLaunchApp
} from '../src/android'
import ernConfig from '../src/config'
import inquirer from 'inquirer'
import * as fixtures from './fixtures/common'

const readFile = Promise.promisify(fs.readFile)
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

// Ora stubs
const oraProto = Object.getPrototypeOf(ora())
const oraFailStub = sinon.stub()
const oraStartStub = sinon.stub(oraProto, 'start').returns({
  fail: oraFailStub,
  succeed: sinon.stub()
})

// class in test stubs
const execpStub = sinon.stub(childProcess, 'execp')
const inquirerStub = sinon.stub(inquirer, 'prompt')
const installAndLaunchAppStub = sinon.stub(installAndLaunchApp.prototype)

// Before each test
beforeEach(() => {
  logErrorStub.reset()
  logInfoStub.reset()
  execpStub.reset()
  inquirerStub.reset()
})

after(() => {
  execpStub.restore()
  inquirerStub.restore()
})

let ernConfigStub

afterEach(() => {
  ernConfigStub && ernConfigStub.restore()
})

function resolveInquirer (answer) {
  inquirerStub.resolves(answer)
}

describe('android.js', () => {
  // ==========================================================
  // runAndroid
  // ==========================================================
  describe('runAndroid', () => {
    it('runAndroid throws error with more than 2 running devices', async () => {
      const avdStdOut = await readFile(
        path.resolve(__dirname, './fixtures/adb_devices'),
        {encoding: 'utf8'}
      )
      execpStub.resolves(avdStdOut)
      try {
        await runAndroid(fixtures.pkgName, fixtures.activityName)
      } catch (e) {
        expect(e.message).to.include('More than one device/emulator is running !')
      }
    })
  })

  // ==========================================================
  // runAndroid
  // ==========================================================
  describe('getDevices', () => {
    it('get adb devices as list from stdout', async () => {
      const avdStdOut = await readFile(
        path.resolve(__dirname, './fixtures/adb_devices'),
        {encoding: 'utf8'}
      )
      execpStub.resolves(avdStdOut)
      const devices = await getDevices()
      expect(devices).to.include(fixtures.deviceOne)
      expect(devices).to.include(fixtures.deviceTwo)
    })

    it('get adb devices with ', async () => {
      const avdStdOut = await readFile(
        path.resolve(__dirname, './fixtures/adb_with_no_devices'),
        {encoding: 'utf8'}
      )
      execpStub.resolves(avdStdOut)
      const devices = await getDevices()
      expect(devices).to.eql([])
    })
  })

  // ==========================================================
  // askUserToSelectAvdEmulator
  // ==========================================================
  describe('askUserToSelectAvdEmulator', () => {
    it('prompt user if previous emulator flag is false', async () => {
      const avdStdOut = await readFile(
        path.resolve(__dirname, './fixtures/emulator_list_avds'),
        {encoding: 'utf8'}
      )
      execpStub.resolves(avdStdOut)
      const config = {
        android: {
          usePreviousEmulator: false,
          emulatorName: fixtures.oneAvd
        }
      }
      resolveInquirer({avdImageName: fixtures.oneAvd})
      ernConfigStub = sinon.stub(ernConfig, 'getValue').returns(config)
      expect(await askUserToSelectAvdEmulator()).to.be.equal(fixtures.oneAvd)
    })

    it('prompt user if avd is missing and previous emulator flag is true', async () => {
      const avdStdOut = await readFile(
        path.resolve(__dirname, './fixtures/emulator_list_avds'),
        {encoding: 'utf8'}
      )
      execpStub.resolves(avdStdOut)
      const config = {
        android: {
          usePreviousEmulator: true,
          emulatorName: 'AvdNotPresent'
        }
      }
      resolveInquirer({avdImageName: fixtures.oneAvd})
      ernConfigStub = sinon.stub(ernConfig, 'getValue').returns(config)
      expect(await askUserToSelectAvdEmulator()).to.be.equal(fixtures.oneAvd)
    })

    it('prompt user if emulator config is not present', async () => {
      const avdStdOut = await readFile(
        path.resolve(__dirname, './fixtures/emulator_list_avds'),
        {encoding: 'utf8'}
      )
      execpStub.resolves(avdStdOut)
      const config = null
      resolveInquirer({avdImageName: fixtures.oneAvd})
      ernConfigStub = sinon.stub(ernConfig, 'getValue').returns(config)
      expect(await askUserToSelectAvdEmulator()).to.be.equal(fixtures.oneAvd)
    })

    it('prompt user if usePreviousEmulator flag is not present', async () => {
      const avdStdOut = await readFile(
        path.resolve(__dirname, './fixtures/emulator_list_avds'),
        {encoding: 'utf8'}
      )
      execpStub.resolves(avdStdOut)
      const config = {
        android: {}
      }
      resolveInquirer({avdImageName: fixtures.oneAvd})
      ernConfigStub = sinon.stub(ernConfig, 'getValue').returns(config)
      expect(await askUserToSelectAvdEmulator()).to.be.equal(fixtures.oneAvd)
    })

    it('do not prompt user if previous emulator flag is true', async () => {
      const avdStdOut = await readFile(
        path.resolve(__dirname, './fixtures/emulator_list_avds'),
        {encoding: 'utf8'}
      )
      execpStub.resolves(avdStdOut)
      const config = {
        android: {
          usePreviousEmulator: true,
          emulatorName: fixtures.oneAvd
        }
      }
      ernConfigStub = sinon.stub(ernConfig, 'getValue').returns(config)
      expect(await askUserToSelectAvdEmulator()).to.be.equal(fixtures.oneAvd)
    })
  })

  // ==========================================================
  // getAndroidAvds
  // ==========================================================
  describe('getAndroidAvds', () => {
    it('return non-empty list with 2 avds', async () => {
      const avdStdOut = await readFile(
        path.resolve(__dirname, './fixtures/emulator_list_avds'),
        {encoding: 'utf8'}
      )
      execpStub.resolves(avdStdOut)
      const avdList = await getAndroidAvds()
      expect(avdList).to.have.length(2)
      expect(avdList).to.eql(fixtures.multipleAvdList)
    })

    it('return non-empty list with 1 avd', async () => {
      const avdStdOut = await readFile(
        path.resolve(__dirname, './fixtures/emulator_one_avd'),
        {encoding: 'utf8'}
      )
      execpStub.resolves(avdStdOut)
      const avdList = await getAndroidAvds()
      expect(avdList).to.have.length(1)
      expect(avdList).to.eql(fixtures.oneAvdList)
    })

    it('return empty list of configured avd', async () => {
      const avdStdOut = ''
      execpStub.resolves(avdStdOut)
      const avdList = await getAndroidAvds()
      expect(avdList).to.eql([''])
    })
  })

})
