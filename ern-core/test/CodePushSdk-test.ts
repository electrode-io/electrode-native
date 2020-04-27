import CodePushSdk from '../src/CodePushSdk';
import CodePush from 'code-push';
import sinon from 'sinon';

const sandbox = sinon.createSandbox();

describe('CodePushSdk', () => {
  let codePushStub: any;

  beforeEach(() => {
    codePushStub = sandbox.stub(CodePush.prototype);
  });

  afterEach(() => {
    sandbox.restore();
  });

  const createCodePushSdk = () =>
    new CodePushSdk({
      accessKey: 'nIuHktiSabWrsjvswelpHaGgSkhclHURTUWFzmbb',
    });

  describe('releaseReact', () => {
    it('should call codepush release method', async () => {
      const sut = createCodePushSdk();
      sut.releaseReact(
        'test-android',
        'Production',
        '/path/to/bundle',
        '1.0.0',
        { rollout: 100 },
      );
      sandbox.assert.called(codePushStub.release);
    });

    it('should delete the rollout key if rollout is 100', async () => {
      const sut = createCodePushSdk();
      sut.releaseReact(
        'test-android',
        'Production',
        '/path/to/bundle',
        '1.0.0',
        { rollout: 100 },
      );
      sandbox.assert.calledWith(
        codePushStub.release,
        'test-android',
        'Production',
        '/path/to/bundle',
        '1.0.0',
        {},
      );
    });

    it('should not delete the rollout key if rollout is not 100', async () => {
      const sut = createCodePushSdk();
      sut.releaseReact(
        'test-android',
        'Production',
        '/path/to/bundle',
        '1.0.0',
        { rollout: 50 },
      );
      sandbox.assert.calledWith(
        codePushStub.release,
        'test-android',
        'Production',
        '/path/to/bundle',
        '1.0.0',
        { rollout: 50 },
      );
    });
  });

  describe('promote', () => {
    it('should call codepush promote method', async () => {
      const sut = createCodePushSdk();
      sut.promote('test-android', 'QA', 'Production', {
        label: 'v1',
        rollout: 100,
      });
      sandbox.assert.called(codePushStub.promote);
    });

    it('should delete the rollout key if rollout is 100', async () => {
      const sut = createCodePushSdk();
      sut.promote('test-android', 'QA', 'Production', {
        label: 'v1',
        rollout: 100,
      });
      sandbox.assert.calledWith(
        codePushStub.promote,
        'test-android',
        'QA',
        'Production',
        { label: 'v1' },
      );
    });

    it('should not delete the rollout key if rollout is not 100', async () => {
      const sut = createCodePushSdk();
      sut.promote('test-android', 'QA', 'Production', {
        label: 'v1',
        rollout: 50,
      });
      sandbox.assert.calledWith(
        codePushStub.promote,
        'test-android',
        'QA',
        'Production',
        { label: 'v1', rollout: 50 },
      );
    });
  });

  describe('patch', () => {
    it('should call codepush patch method', async () => {
      const sut = createCodePushSdk();
      sut.patch('test-android', 'QA', {
        isMandatory: true,
        label: 'v1',
        rollout: 100,
      });
      sandbox.assert.called(codePushStub.patchRelease);
    });

    it('should delete the rollout key if rollout is 100', async () => {
      const sut = createCodePushSdk();
      sut.patch('test-android', 'QA', {
        isMandatory: true,
        label: 'v1',
        rollout: 100,
      });
      sandbox.assert.calledWith(
        codePushStub.patchRelease,
        'test-android',
        'QA',
        'v1',
        { isMandatory: true, label: 'v1' },
      );
    });

    it('should not delete the rollout key if rollout is not 100', async () => {
      const sut = createCodePushSdk();
      sut.patch('test-android', 'QA', {
        isMandatory: true,
        label: 'v1',
        rollout: 50,
      });
      sandbox.assert.calledWith(
        codePushStub.patchRelease,
        'test-android',
        'QA',
        'v1',
        { isMandatory: true, label: 'v1', rollout: 50 },
      );
    });
  });
});
