import { expect } from 'chai';
import { afterTest, beforeTest } from 'ern-util-dev';
import fs from 'fs';
import path from 'path';
import * as childProcess from '../src/childProcess';
import sinon from 'sinon';
import * as android from '../src/android';
import ernConfig from '../src/config';
import inquirer from 'inquirer';
import * as fixtures from './fixtures/common';
import util from 'util';

const readFile = util.promisify(fs.readFile);
const sandbox = sinon.createSandbox();

let ernConfigGetStub: any;
let execpStub: any;

describe('android.js', () => {
  beforeEach(() => {
    beforeTest();

    ernConfigGetStub = sandbox.stub(ernConfig, 'get');

    // class in test stubs
    execpStub = sandbox.stub(childProcess, 'execp');
    sandbox.stub(process, 'platform').returns('win');
  });

  afterEach(() => {
    afterTest();
    sandbox.restore();
  });

  // ==========================================================
  // runAndroid
  // ==========================================================
  describe('runAndroid', () => {
    it('runAndroid throws error with more than 2 running devices', async () => {
      execpStub.resolves(fixtures.getDeviceResult);
      try {
        await android.runAndroid({
          activityName: 'MainActivity',
          packageName: fixtures.pkgName,
        });
      } catch (e) {
        expect(e.message).to.include(
          'More than one device/emulator is running !',
        );
      }
    });
  });

  // ==========================================================
  // runAndroid
  // ==========================================================
  describe('getDevices', () => {
    it('get adb devices as list from stdout', async () => {
      const avdStdOut = await readFile(
        path.resolve(__dirname, './fixtures/adb_devices'),
      );
      execpStub.resolves(avdStdOut);
      const devices = await android.getDevices();
      expect(devices).to.include(fixtures.deviceOne);
      expect(devices).to.include(fixtures.deviceTwo);
    });

    it('get adb devices with ', async () => {
      const avdStdOut = await readFile(
        path.resolve(__dirname, './fixtures/adb_with_no_devices'),
      );
      execpStub.resolves(avdStdOut);
      const devices = await android.getDevices();
      expect(devices).to.eql([]);
    });
  });

  // ==========================================================
  // askUserToSelectAvdEmulator
  // ==========================================================
  describe('askUserToSelectAvdEmulator', () => {
    it('prompt user if previous emulator flag is false', async () => {
      execpStub.resolves(fixtures.oneAvdList);
      const config = {
        deviceId: fixtures.oneAvd,
        usePreviousDevice: false,
      };
      const inquirerStub = sinon.stub(inquirer, 'prompt').resolves({
        avdImageName: fixtures.oneAvd,
      });
      ernConfigGetStub.returns(config);
      const result = await android.askUserToSelectAvdEmulator();
      inquirerStub.restore();
      expect(result).to.be.equal(fixtures.oneAvd);
    });

    it('prompt user if avd is missing and previous emulator flag is true', async () => {
      execpStub.resolves(fixtures.oneAvdList);
      const config = {
        deviceId: 'AvdNotPresent',
        usePreviousDevice: true,
      };
      const inquirerStub = sinon.stub(inquirer, 'prompt').resolves({
        avdImageName: fixtures.oneAvd,
      });
      ernConfigGetStub.returns(config);
      const result = await android.askUserToSelectAvdEmulator();
      inquirerStub.restore();
      expect(result).to.be.equal(fixtures.oneAvd);
    });

    it('prompt user if emulator config is not present', async () => {
      execpStub.resolves(fixtures.oneAvdList);
      const config = null;
      const inquirerStub = sinon.stub(inquirer, 'prompt').resolves({
        avdImageName: fixtures.oneAvd,
      });
      ernConfigGetStub.returns(config);
      const result = await android.askUserToSelectAvdEmulator();
      inquirerStub.restore();
      expect(result).to.be.equal(fixtures.oneAvd);
    });

    it('prompt user if usePreviousEmulator flag is not present', async () => {
      execpStub.resolves(fixtures.oneAvdList);
      const config = {};
      const inquirerStub = sinon.stub(inquirer, 'prompt').resolves({
        avdImageName: fixtures.oneAvd,
      });
      ernConfigGetStub.returns(config);
      const result = await android.askUserToSelectAvdEmulator();
      inquirerStub.restore();
      expect(result).to.be.equal(fixtures.oneAvd);
    });

    it('do not prompt user if previous emulator flag is true', async () => {
      execpStub.resolves(fixtures.oneAvdList);
      const config = {
        deviceId: fixtures.oneAvd,
        usePreviousDevice: true,
      };
      ernConfigGetStub.returns(config);
      expect(await android.askUserToSelectAvdEmulator()).to.be.equal(
        fixtures.oneAvd,
      );
    });
  });

  // ==========================================================
  // getAndroidAvds
  // ==========================================================
  describe('getAndroidAvds', () => {
    it('return non-empty list with 2 avds', async () => {
      const avdStdOut = await readFile(
        path.resolve(__dirname, './fixtures/emulator_list_avds'),
      );
      execpStub.resolves(avdStdOut);
      const avdList = await android.getAndroidAvds();
      expect(avdList).to.have.length(2);
      expect(avdList).to.eql(fixtures.multipleAvdList);
    });

    it('return non-empty list with 1 avd', async () => {
      const avdStdOut = await readFile(
        path.resolve(__dirname, './fixtures/emulator_one_avd'),
      );
      execpStub.resolves(avdStdOut);
      const avdList = await android.getAndroidAvds();
      expect(avdList).to.have.length(1);
      expect(avdList).to.eql(fixtures.oneAvdList);
    });

    it('return empty list of configured avd', async () => {
      const avdStdOut = '';
      execpStub.resolves(avdStdOut);
      const avdList = await android.getAndroidAvds();
      expect(avdList).to.eql([]);
    });
  });

  // ==========================================================
  // getGradleByPlatform
  // ==========================================================
  describe('getGradleByPlatform', () => {
    it('check gradlew is returned for win  ', () => {
      const platform = Object.getOwnPropertyDescriptor(process, 'platform');
      Object.defineProperty(process, 'platform', {
        value: 'win',
      });
      expect(android.getGradleByPlatform()).to.eql('gradlew');
      Object.defineProperty(process, 'platform', {
        value: platform,
      });
    });

    it('check ./gradlew is returned for darwin  ', () => {
      const platform = Object.getOwnPropertyDescriptor(process, 'platform');
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
      });
      expect(android.getGradleByPlatform()).to.eql('./gradlew');
      Object.defineProperty(process, 'platform', {
        value: platform,
      });
    });

    it('check ./gradlew is returned for linux  ', () => {
      const platform = Object.getOwnPropertyDescriptor(process, 'platform');
      Object.defineProperty(process, 'platform', {
        value: 'linux',
      });
      expect(android.getGradleByPlatform()).to.eql('./gradlew');
      Object.defineProperty(process, 'platform', {
        value: platform,
      });
    });
  });

  // ==========================================================
  // androidGetBootAnimProp
  // ==========================================================
  describe('installApk', () => {
    it('adb install -r', async () => {
      execpStub.resolves('Stopped');
      expect(await android.androidGetBootAnimProp()).to.eql('Stopped');
    });
  });

  // ==========================================================
  // resolveAndroidVersions
  // ==========================================================
  describe('resolveAndroidVersions', () => {
    it('should return all default versions if no versions are provided', () => {
      const versions = android.resolveAndroidVersions();
      expect(versions).deep.equal({
        androidGradlePlugin: android.DEFAULT_ANDROID_GRADLE_PLUGIN_VERSION,
        androidxAppcompactVersion: android.DEFAULT_ANDROIDX_APPCOMPACT_VERSION,
        androidxLifecycleExtrnsionsVersion:
          android.DEFAULT_ANDROIDX_LIFECYCLE_EXTENSIONS_VERSION,
        buildToolsVersion: android.DEFAULT_BUILD_TOOLS_VERSION,
        compileSdkVersion: android.DEFAULT_COMPILE_SDK_VERSION,
        gradleDistributionVersion: android.DEFAULT_GRADLE_DISTRIBUTION_VERSION,
        minSdkVersion: android.DEFAULT_MIN_SDK_VERSION,
        sourceCompatibility: android.DEFAULT_SOURCE_COMPATIBILITY,
        supportLibraryVersion: android.DEFAULT_SUPPORT_LIBRARY_VERSION,
        targetCompatibility: android.DEFAULT_TARGET_COMPATIBILITY,
        targetSdkVersion: android.DEFAULT_TARGET_SDK_VERSION,
      });
    });

    it('should return default versions along with user provided versions', () => {
      const versions = android.resolveAndroidVersions({
        androidGradlePlugin: '3.0.0',
        minSdkVersion: '15',
        sourceCompatibility: 'VERSION_1_9',
        targetCompatibility: 'VERSION_1_9',
      });
      expect(versions).deep.equal({
        androidGradlePlugin: '3.0.0',
        androidxAppcompactVersion: android.DEFAULT_ANDROIDX_APPCOMPACT_VERSION,
        androidxLifecycleExtrnsionsVersion:
          android.DEFAULT_ANDROIDX_LIFECYCLE_EXTENSIONS_VERSION,
        buildToolsVersion: android.DEFAULT_BUILD_TOOLS_VERSION,
        compileSdkVersion: android.DEFAULT_COMPILE_SDK_VERSION,
        gradleDistributionVersion: android.DEFAULT_GRADLE_DISTRIBUTION_VERSION,
        minSdkVersion: '15',
        sourceCompatibility: 'VERSION_1_9',
        supportLibraryVersion: android.DEFAULT_SUPPORT_LIBRARY_VERSION,
        targetCompatibility: 'VERSION_1_9',
        targetSdkVersion: android.DEFAULT_TARGET_SDK_VERSION,
      });
    });

    it('should return only user provided versions', () => {
      const versions = android.resolveAndroidVersions({
        androidGradlePlugin: '3.0.0',
        androidxAppcompactVersion: '1.0.0',
        androidxLifecycleExtrnsionsVersion: '2.0.0',
        buildToolsVersion: '27.0.0',
        compileSdkVersion: '27',
        gradleDistributionVersion: '4.5',
        minSdkVersion: '15',
        sourceCompatibility: 'VERSION_1_9',
        supportLibraryVersion: '27.0.0',
        targetCompatibility: 'VERSION_1_9',
        targetSdkVersion: '27',
      });
      expect(versions).deep.equal({
        androidGradlePlugin: '3.0.0',
        androidxAppcompactVersion: '1.0.0',
        androidxLifecycleExtrnsionsVersion: '2.0.0',
        buildToolsVersion: '27.0.0',
        compileSdkVersion: '27',
        gradleDistributionVersion: '4.5',
        minSdkVersion: '15',
        sourceCompatibility: 'VERSION_1_9',
        supportLibraryVersion: '27.0.0',
        targetCompatibility: 'VERSION_1_9',
        targetSdkVersion: '27',
      });
    });
  });
});
