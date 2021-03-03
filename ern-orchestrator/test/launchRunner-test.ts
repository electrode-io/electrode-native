import * as core from 'ern-core';
import { launchRunner } from '../src/launchRunner';
import * as x from '../src/launchOnDevice';
import * as y from '../src/launchOnSimulator';
import sinon from 'sinon';

const sandbox = sinon.createSandbox();

describe('launchRunner', () => {
  let runAndroidProjectStub: any;
  let launchOnDeviceStub: any;
  let launchOnSimulatorStub: any;

  beforeEach(() => {
    runAndroidProjectStub = sandbox.stub(core.android, 'runAndroidProject');
    launchOnDeviceStub = sandbox.stub(x, 'launchOnDevice');
    launchOnSimulatorStub = sandbox.stub(y, 'launchOnSimulator');
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should call runAndroidProject to launch the Android runner [android]', async () => {
    await launchRunner({
      extra: { packageName: 'com.walmartlabs.ern' },
      pathToRunner: '/home/user/test',
      platform: 'android',
    });
    sandbox.assert.calledWith(runAndroidProjectStub, {
      launchFlags: undefined,
      packageName: 'com.walmartlabs.ern',
      projectPath: '/home/user/test',
    });
  });

  it('should call launchOnDevice if there are one or more iOS device connected [iOS]', async () => {
    const iosDevices = [
      {
        name: 'iPhone X',
        udid: 'DB3D6BC0-BB08-4340-8D03-A87D69E5BEA6',
        version: '11.3',
      },
    ];
    sandbox.stub(core.ios, 'getiPhoneRealDevices').returns(iosDevices);
    await launchRunner({ platform: 'ios', pathToRunner: '/home/user/test' });
    sandbox.assert.calledWith(
      launchOnDeviceStub as any,
      '/home/user/test',
      iosDevices,
    );
  });

  it('should call launchOnSimulator if there are no iOS device connected [iOS]', async () => {
    sandbox.stub(core.ios, 'getiPhoneRealDevices').returns([]);
    await launchRunner({ platform: 'ios', pathToRunner: '/home/user/test' });
    sandbox.assert.calledWith(launchOnSimulatorStub as any, '/home/user/test');
  });
});
