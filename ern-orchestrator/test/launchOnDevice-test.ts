import * as core from 'ern-core';
import childProcess from 'child_process';
import * as build from '../src/buildIosRunner';
import { doesThrow } from 'ern-util-dev';
import { launchOnDevice } from '../src/launchOnDevice';
import { assert } from 'chai';
import sinon from 'sinon';

const sandbox = sinon.createSandbox();

describe('launchOnDevice', () => {
  const devices = ['iPhone X'];
  let askUserDeviceStub: any;
  let spawnStub: any;

  beforeEach(() => {
    askUserDeviceStub = sandbox
      .stub(core.ios, 'askUserToSelectAniPhoneDevice')
      .resolves({
        name: 'iPhone X',
        udid: 'DB3D6BC0-BB08-4340-8D03-A87D69E5BEA6',
        version: '11.3',
      });
    sandbox.stub(core.shell);
    sandbox.stub(build, 'buildIosRunner');
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should ask the user to select an iOS device', async () => {
    spawnStub = sandbox.stub(childProcess, 'spawnSync').returns({});
    await launchOnDevice('/Users/foo/test', devices);
    sandbox.assert.calledWith(askUserDeviceStub, devices);
  });

  it('should call ios-deploy with correct arguments', async () => {
    sandbox.stub(childProcess, 'spawnSync').returns({});
    await launchOnDevice('/Users/foo/test', devices);
    const expectedIosDeployArgs = [
      '--bundle',
      '/Users/foo/test/build/Debug-iphoneos/ErnRunner.app',
      '--id',
      'DB3D6BC0-BB08-4340-8D03-A87D69E5BEA6',
      '--justlaunch',
    ];
    sandbox.assert.calledWith(
      spawnStub,
      'ios-deploy',
      sinon.match.array.deepEquals(expectedIosDeployArgs),
      { encoding: 'utf8' },
    );
  });

  it('should throw if ios-deploy fails', async () => {
    sandbox.stub(childProcess, 'spawnSync').throws(new Error('fail'));
    assert(await doesThrow(launchOnDevice, '/Users/foo/test', devices));
  });
});
