import mockFs from 'mock-fs';
import path from 'path';
import os from 'os';
import { expect } from 'chai';
import { getCodePushInitConfig } from '../src/getCodePushInitConfig';

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

describe('getCodePushInitConfig', () => {
  afterEach(() => {
    mockFs.restore();
  });

  it('should return the access key from code push config if keys are present in both config files', () => {
    mockFs(
      {
        [ernRcPath]: ernRcWithCodePushAccessKey,
        [codePushConfigPath]: codePushConfigWithAccessKey,
      },
      {
        createCwd: false,
      },
    );
    expect(getCodePushInitConfig().accessKey).to.be.equal(
      codePushConfigAccessKey,
    );
  });

  it('should return the access key from code push config if key is not present in .ernrc', () => {
    mockFs(
      {
        [ernRcPath]: ernRcWithoutCodePushAccessKey,
        [codePushConfigPath]: codePushConfigWithAccessKey,
      },
      {
        createCwd: false,
      },
    );
    expect(getCodePushInitConfig().accessKey).to.be.equal(
      codePushConfigAccessKey,
    );
  });

  it('should return undefined if key is not found in .ernrc nor in .code-push.config', () => {
    mockFs(
      {
        [ernRcPath]: ernRcWithoutCodePushAccessKey,
        [codePushConfigPath]: codePushConfigWithoutAccessKey,
      },
      {
        createCwd: false,
      },
    );
    expect(getCodePushInitConfig().accessKey).to.be.undefined;
  });

  it('should return undefined if key is not found in .ernrc and .code-push.config does not exist', () => {
    mockFs(
      {
        [ernRcPath]: ernRcWithoutCodePushAccessKey,
      },
      {
        createCwd: false,
      },
    );
    expect(getCodePushInitConfig().accessKey).to.be.undefined;
  });
});
