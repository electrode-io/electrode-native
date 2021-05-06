import mockFs from 'mock-fs';
import path from 'path';
import os from 'os';
import { expect } from 'chai';
import getCodePushSdk from '../src/getCodePushSdk';

const ernRcPath = path.join(os.homedir(), '.ern', '.ernrc');
const codePushConfigPath = path.join(
  process.env.LOCALAPPDATA || process.env.HOME || '',
  '.code-push.config',
);

const ernRcCodePushAccessKey = '0e2509c78c4f94c25e69131a0a5e5be3b7d2927b';
const codePushConfigAccessKey = '1e2509c78c4f94c25e69131a0a5e5be3b7d2927b';

const ernRcWithCodePushAccessKey = JSON.stringify({
  codePushAccessKey: ernRcCodePushAccessKey,
});
const codePushConfigWithAccessKey = JSON.stringify({
  accessKey: codePushConfigAccessKey,
});
const ernRcWithoutCodePushAccessKey = JSON.stringify({});
const codePushConfigWithoutAccessKey = JSON.stringify({});

// ==========================================================
// getCodePushSdk
// ==========================================================
describe('getCodePushSdk', () => {
  afterEach(() => {
    mockFs.restore();
  });

  it('should not throw if an access key exists', () => {
    mockFs(
      {
        [ernRcPath]: ernRcWithCodePushAccessKey,
        [codePushConfigPath]: codePushConfigWithAccessKey,
      },
      {
        createCwd: false,
      },
    );
    expect(getCodePushSdk).to.not.throw();
  });

  it('should throw if no access key exists', () => {
    mockFs(
      {
        [ernRcPath]: ernRcWithoutCodePushAccessKey,
        [codePushConfigPath]: codePushConfigWithoutAccessKey,
      },
      {
        createCwd: false,
      },
    );
    expect(getCodePushSdk).to.throw();
  });
});
