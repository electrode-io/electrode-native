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
import * as android from '../src/android'
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
const processStub = sinon.stub(process, 'platform').returns('win')
let ernConfigStub

after(() => {
  execpStub.restore()
  processStub.restore()
})

beforeEach(() => {
  logErrorStub.reset()
  logInfoStub.reset()
})

afterEach(() => {
  ernConfigStub && ernConfigStub.restore()
})

describe('android.js', () => {
  // ==========================================================
  // runAndroid
  // ==========================================================
  describe('runAndroid', () => {
    it('runAndroid throws error with more than 2 running devices', async () => {
      execpStub.resolves(fixtures.getDeviceResult)
      try {
        await android.runAndroid(fixtures.pkgName, fixtures.activityName)
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
      const devices = await android.getDevices()
      expect(devices).to.include(fixtures.deviceOne)
      expect(devices).to.include(fixtures.deviceTwo)
    })

    it('get adb devices with ', async () => {
      const avdStdOut = await readFile(
        path.resolve(__dirname, './fixtures/adb_with_no_devices'),
        {encoding: 'utf8'}
      )
      execpStub.resolves(avdStdOut)
      const devices = await android.getDevices()
      expect(devices).to.eql([])
    })
  })

  // ==========================================================
  // askUserToSelectAvdEmulator
  // ==========================================================
  describe('askUserToSelectAvdEmulator', () => {
    it('prompt user if previous emulator flag is false', async () => {
      execpStub.resolves(fixtures.oneAvdList)
      const config = {
        android: {
          usePreviousEmulator: false,
          emulatorName: fixtures.oneAvd
        }
      }
      const inquirerStub = sinon.stub(inquirer, 'prompt').resolves({
        avdImageName: fixtures.oneAvd
      })
      ernConfigStub = sinon.stub(ernConfig, 'getValue').returns(config)
      const result = await android.askUserToSelectAvdEmulator()
      inquirerStub.restore()
      expect(result).to.be.equal(fixtures.oneAvd)
    })

    it('prompt user if avd is missing and previous emulator flag is true', async () => {
      execpStub.resolves(fixtures.oneAvdList)
      const config = {
        android: {
          usePreviousEmulator: true,
          emulatorName: 'AvdNotPresent'
        }
      }
      const inquirerStub = sinon.stub(inquirer, 'prompt').resolves({
        avdImageName: fixtures.oneAvd
      })
      ernConfigStub = sinon.stub(ernConfig, 'getValue').returns(config)
      const result = await android.askUserToSelectAvdEmulator()
      inquirerStub.restore()
      expect(result).to.be.equal(fixtures.oneAvd)
    })

    it('prompt user if emulator config is not present', async () => {
      execpStub.resolves(fixtures.oneAvdList)
      const config = null
      const inquirerStub = sinon.stub(inquirer, 'prompt').resolves({
        avdImageName: fixtures.oneAvd
      })
      ernConfigStub = sinon.stub(ernConfig, 'getValue').returns(config)
      const result = await android.askUserToSelectAvdEmulator()
      inquirerStub.restore()
      expect(result).to.be.equal(fixtures.oneAvd)
    })

    it('prompt user if usePreviousEmulator flag is not present', async () => {
      execpStub.resolves(fixtures.oneAvdList)
      const config = {
        android: {}
      }
      const inquirerStub = sinon.stub(inquirer, 'prompt').resolves({
        avdImageName: fixtures.oneAvd
      })
      ernConfigStub = sinon.stub(ernConfig, 'getValue').returns(config)
      const result = await android.askUserToSelectAvdEmulator()
      inquirerStub.restore()
      expect(result).to.be.equal(fixtures.oneAvd)
    })

    it('do not prompt user if previous emulator flag is true', async () => {
      execpStub.resolves(fixtures.oneAvdList)
      const config = {
        android: {
          usePreviousEmulator: true,
          emulatorName: fixtures.oneAvd
        }
      }
      ernConfigStub = sinon.stub(ernConfig, 'getValue').returns(config)
      expect(await android.askUserToSelectAvdEmulator()).to.be.equal(fixtures.oneAvd)
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
      const avdList = await android.getAndroidAvds()
      expect(avdList).to.have.length(2)
      expect(avdList).to.eql(fixtures.multipleAvdList)
    })

    it('return non-empty list with 1 avd', async () => {
      const avdStdOut = await readFile(
        path.resolve(__dirname, './fixtures/emulator_one_avd'),
        {encoding: 'utf8'}
      )
      execpStub.resolves(avdStdOut)
      const avdList = await android.getAndroidAvds()
      expect(avdList).to.have.length(1)
      expect(avdList).to.eql(fixtures.oneAvdList)
    })

    it('return empty list of configured avd', async () => {
      const avdStdOut = ''
      execpStub.resolves(avdStdOut)
      const avdList = await android.getAndroidAvds()
      expect(avdList).to.eql([''])
    })
  })

  // ==========================================================
  // installApk
  // ==========================================================
  describe('installApk', () => {
    it('adb install -r', async () => {
      execpStub.resolves('Success')
      expect(await android.installApk()).to.eql('Success')
    })
  })

  // ==========================================================
  // launchAndroidActivity
  // ==========================================================
  describe('launchAndroidActivity', () => {
    it('adb shell am start -n', async () => {
      execpStub.resolves('Starting: Intent { cmp=')
      expect(await android.launchAndroidActivity()).to.eql('Starting: Intent { cmp=')
    })
  })

  // ==========================================================
  // buildAndInstallApp
  // ==========================================================
  describe('buildAndInstallApp', () => {
    it('check gradlew is used as execp for win  ', async () => {
      execpStub.resolves('installDebug success')
      expect(await android.buildAndInstallApp()).to.eql('installDebug success')
    })
  })

  // ==========================================================
  // getGradleByPlatform
  // ==========================================================
  describe('getGradleByPlatform', () => {
    it('check gradlew is returned for win  ', () => {
      const platform = Object.getOwnPropertyDescriptor(process, 'platform')
      Object.defineProperty(process, 'platform', {
        value: 'win'
      })
      expect(android.getGradleByPlatform()).to.eql('gradlew')
      Object.defineProperty(process, 'platform', {
        value: platform
      })
    })

    it('check ./gradlew is returned for darwin  ', () => {
      const platform = Object.getOwnPropertyDescriptor(process, 'platform')
      Object.defineProperty(process, 'platform', {
        value: 'darwin'
      })
      expect(android.getGradleByPlatform()).to.eql('./gradlew')
      Object.defineProperty(process, 'platform', {
        value: platform
      })
    })

    it('check ./gradlew is returned for linux  ', () => {
      const platform = Object.getOwnPropertyDescriptor(process, 'platform')
      Object.defineProperty(process, 'platform', {
        value: 'linux'
      })
      expect(android.getGradleByPlatform()).to.eql('./gradlew')
      Object.defineProperty(process, 'platform', {
        value: platform
      })
    })
  })

  // ==========================================================
  // androidGetBootAnimProp
  // ==========================================================
  describe('installApk', () => {
    it('adb install -r', async () => {
      execpStub.resolves('Stopped')
      expect(await android.androidGetBootAnimProp()).to.eql('Stopped')
    })
  })
})
