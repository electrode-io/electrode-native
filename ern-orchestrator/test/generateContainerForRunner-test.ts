import sinon from 'sinon';
import { AppVersionDescriptor, PackagePath } from 'ern-core';
import { generateContainerForRunner } from '../src/generateContainerForRunner';
import * as container from '../src/container';
import * as composite from '../src/composite';

const sandbox = sinon.createSandbox();

describe('generateContainerForRunner', () => {
  let containerStub: any;
  let compositeStub: any;

  beforeEach(() => {
    containerStub = sandbox.stub(container);
    compositeStub = sandbox.stub(composite);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should call runCauldronContainerGen with proper arguments if a descriptor is provided', async () => {
    const descriptor = AppVersionDescriptor.fromString('test:android:1.0.0');
    const outDir = '/home/user/test';
    await generateContainerForRunner('android', {
      napDescriptor: descriptor,
      outDir,
    });
    sinon.assert.calledWith(
      containerStub.runCauldronContainerGen,
      descriptor,
      undefined,
      {
        jsMainModuleName: undefined,
        outDir,
      },
    );
  });

  it('should call runLocalContainerGen with proper arguments if no descriptor is provided', async () => {
    const outDir = '/home/user/test';
    const miniApps = [PackagePath.fromString('a@1.0.0')];
    const jsApiImpls = [PackagePath.fromString('b@1.0.0')];
    const dependencies = [PackagePath.fromString('c@1.0.0')];
    await generateContainerForRunner('android', {
      jsApiImpls,
      miniApps,
      outDir,
    });
    sinon.assert.calledWith(
      containerStub.runLocalContainerGen,
      'android',
      undefined,
      {
        extra: {},
        jsMainModuleName: undefined,
        outDir,
      },
    );
  });

  it('should call runLocalContainerGen with extra arguments if no descriptor is provided', async () => {
    const outDir = '/home/user/test';
    const miniApps = [PackagePath.fromString('a@1.0.0')];
    const jsApiImpls = [PackagePath.fromString('b@1.0.0')];
    const dependencies = [PackagePath.fromString('c@1.0.0')];
    const extra = { androidConfig: { compileSdkVersion: '28' } };
    await generateContainerForRunner('android', {
      extra,
      jsApiImpls,
      miniApps,
      outDir,
    });
    sinon.assert.calledWith(
      containerStub.runLocalContainerGen,
      'android',
      undefined,
      {
        extra,
        jsMainModuleName: undefined,
        outDir,
      },
    );
  });

  it('should call runLocalCompositeGen with extra arguments if no descriptor is provided', async () => {
    const metroExtraNodeModules = ['dep-a', '/home/user/path/to/dep-b'];
    const extra = { androidConfig: { compileSdkVersion: '28' } };
    await generateContainerForRunner('android', {
      extra: {
        compositeGenerator: {
          metroExtraNodeModules,
        },
      },
      outDir: '/home/user/test',
    });
    sinon.assert.calledWith(compositeStub.runLocalCompositeGen, {
      baseComposite: undefined,
      jsApiImpls: sinon.match.array,
      metroExtraNodeModules,
      miniApps: sinon.match.array,
      outDir: sinon.match.string,
    });
  });
});
