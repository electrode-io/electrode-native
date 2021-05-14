import { expect } from 'chai';
import fs from 'fs';
import path from 'path';
import sinon from 'sinon';
import inquirer from 'inquirer';
import * as fixtures from './fixtures/common';
import ernConfig from '../src/config';
import util from 'util';
import Simctl from 'node-simctl';
const ios = require('../src/ios');

const computerName = 'Funny MacBook Pro (47)\n';
const readFile = util.promisify(fs.readFile);
const iPhoneSimulatorsWithNoIphone = require('./fixtures/ios_no_iphone_simulators.json');
const iPhoneSimulators = require('./fixtures/ios_iphone_simulators.json');

const sandbox = sinon.createSandbox();

const deviceList = [
  {
    name: 'iPhone 5s',
    sdk: '11.1',
    udid: 'CEF8F618-82F3-4BE5-A2B6-92A96F83687A',
  },
  {
    name: 'iPhone 8',
    sdk: '13.4.1',
    udid: '17043F85-C66D-405F-8D13-38460DEF27B6',
  },
];

let getDevicesStub;
let getKnownDevicesStub;
let getComputerNameStub;
let ernConfigGetStub;

function resolveGetDevices(fixtures) {
  getDevicesStub.resolves(fixtures);
}

describe('ios utils', () => {
  beforeEach(() => {
    // test stubs
    getDevicesStub = sandbox.stub(Simctl.prototype, 'getDevices');
    getKnownDevicesStub = sandbox.stub(ios, 'getKnownDevices');
    getComputerNameStub = sandbox.stub(ios, 'getComputerName');
    ernConfigGetStub = sandbox.stub(ernConfig, 'get');
    let ernConfigStub;
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('askUserToSelectAniPhoneDevice', () => {
    it('prompt user to select iPhone Device', async () => {
      const inquirerIosStub = sinon.stub(inquirer, 'prompt').resolves({
        selectedDevice: deviceList[0],
      });
      const result = await ios.askUserToSelectAniPhoneDevice(deviceList);
      inquirerIosStub.restore();
      expect(result).to.deep.equal(deviceList[0]);
    });
  });

  describe('askUserToSelectAniPhoneSimulator', () => {
    it('prompt user to select iPhone Simulator if usePreviousEmulator is false', async () => {
      resolveGetDevices(iPhoneSimulators);
      const config = {
        usePreviousDevice: false,
        deviceId: fixtures.oneUdid,
      };
      ernConfigGetStub.returns(config);
      const inquirerIosStub = sinon.stub(inquirer, 'prompt').resolves({
        selectedSimulator: deviceList[1],
      });
      const result = await ios.askUserToSelectAniPhoneSimulator();
      inquirerIosStub.restore();
      expect(result).to.deep.equal(deviceList[1]);
    });

    it('prompt user if simulator is missing and previous emulator flag is true ', async () => {
      resolveGetDevices(iPhoneSimulators);
      const config = {
        usePreviousDevice: true,
        deviceId: 'SimulatorNotPresent',
      };
      ernConfigGetStub.returns(config);
      const inquirerIosStub = sinon.stub(inquirer, 'prompt').resolves({
        selectedSimulator: deviceList[0],
      });
      const result = await ios.askUserToSelectAniPhoneSimulator();
      inquirerIosStub.restore();
      expect(result).to.deep.equal(deviceList[0]);
    });

    it('do not prompt user to select iPhone Simulator if usePreviousEmulator is true', async () => {
      resolveGetDevices(iPhoneSimulators);
      const config = {
        usePreviousDevice: true,
        deviceId: fixtures.oneUdid,
      };
      ernConfigGetStub.returns(config);
      const result = await ios.askUserToSelectAniPhoneSimulator();
      expect(result.udid).to.eql(fixtures.oneUdid);
    });
  });

  describe('parse iOS device list', () => {
    it('should return empty list without device', async () => {
      const instruments = await readFile(
        path.resolve(__dirname, './fixtures/instruments.txt'),
      );
      expect(ios.parseIOSDevicesList(instruments.toString(), computerName)).to
        .be.empty;
    });
    it('should return item with device', async () => {
      const instrumentsWithDevice = await readFile(
        path.resolve(__dirname, './fixtures/instruments-with-device.txt'),
      );
      expect(
        ios.parseIOSDevicesList(instrumentsWithDevice.toString(), computerName),
      ).to.deep.equal([
        {
          name: 'Hilarious Phone Name',
          sdk: '11.1',
          udid: '695c329443f455c75b5454aacb72ace87b66351e',
        },
      ]);
    });
  });
});
