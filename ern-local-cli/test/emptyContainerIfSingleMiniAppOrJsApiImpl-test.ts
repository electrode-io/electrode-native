import { emptyContainerIfSingleMiniAppOrJsApiImpl } from '../src/lib';
import * as cauldronApi from 'ern-cauldron-api';
import {
  CauldronApi,
  CauldronHelper,
  EphemeralFileStore,
  InMemoryDocumentStore,
} from 'ern-cauldron-api';
import { fixtures } from 'ern-util-dev';
import { AppVersionDescriptor } from 'ern-core';
import { expect } from 'chai';
import sinon from 'sinon';
import jp from 'jsonpath';

const sandbox = sinon.createSandbox();

const singleMiniAppCauldron = {
  nativeApps: [
    {
      name: 'test',
      platforms: [
        {
          name: 'android',
          versions: [
            {
              container: {
                jsApiImpls: [],
                miniApps: ['react-native-bar@2.0.0'],
                nativeDeps: [
                  'react-native@0.42.0',
                  'react-native-code-push@1.17.1-beta',
                ],
              },
              containerVersion: '1.0.0',
              ernPlatformVersion: '1000.0.0',
              isReleased: false,
              name: '1.0.0',

              yarnLocks: {
                container: '2110ae042d2bf337973c7b60615ba19fe7fb120c',
              },
            },
          ],
        },
      ],
    },
  ],
  schemaVersion: '1.0.0',
};

const singleJsApiImplCauldron = {
  nativeApps: [
    {
      name: 'test',
      platforms: [
        {
          name: 'android',
          versions: [
            {
              container: {
                jsApiImpls: [],
                miniApps: ['react-native-bar@2.0.0'],
                nativeDeps: [
                  'react-native@0.42.0',
                  'react-native-code-push@1.17.1-beta',
                ],
              },
              containerVersion: '1.0.0',
              ernPlatformVersion: '1000.0.0',
              isReleased: false,
              name: '1.0.0',

              yarnLocks: {
                container: '2110ae042d2bf337973c7b60615ba19fe7fb120c',
              },
            },
          ],
        },
      ],
    },
  ],
  schemaVersion: '1.0.0',
};

const testAndroid100Path =
  '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="1.0.0")]';

function cloneFixture(fixture: any) {
  return JSON.parse(JSON.stringify(fixture));
}

function createCauldronApi(cauldronDocument: any) {
  return new CauldronApi(
    new InMemoryDocumentStore(cauldronDocument),
    new EphemeralFileStore(),
  );
}

function createCauldronHelper(cauldronDocument: any) {
  return new CauldronHelper(createCauldronApi(cauldronDocument));
}

describe('emptyContainerIfSingleMiniAppOrJsApiImpl', () => {
  afterEach(() => {
    sandbox.restore();
  });

  it('should return true if it emptied the Container', async () => {
    const fixture = cloneFixture(singleMiniAppCauldron);
    sandbox
      .stub(cauldronApi, 'getActiveCauldron')
      .resolves(createCauldronHelper(fixture));
    const result = await emptyContainerIfSingleMiniAppOrJsApiImpl(
      AppVersionDescriptor.fromString('test:android:1.0.0'),
    );
    expect(result).true;
  });

  it('should return false if it did not emptied the Container', async () => {
    const fixture = cloneFixture(fixtures.defaultCauldron);
    sandbox
      .stub(cauldronApi, 'getActiveCauldron')
      .resolves(createCauldronHelper(fixture));
    const result = await emptyContainerIfSingleMiniAppOrJsApiImpl(
      AppVersionDescriptor.fromString('test:android:17.7.0'),
    );
    expect(result).false;
  });

  it('should empty the Container if there is a single MiniApp', async () => {
    const fixture = cloneFixture(singleMiniAppCauldron);
    sandbox
      .stub(cauldronApi, 'getActiveCauldron')
      .resolves(createCauldronHelper(fixture));
    await emptyContainerIfSingleMiniAppOrJsApiImpl(
      AppVersionDescriptor.fromString('test:android:1.0.0'),
    );
    const version = jp.query(fixture, testAndroid100Path)[0];
    expect(version.container.miniApps).empty;
    expect(version.container.nativeDeps).empty;
    expect(version.yarnLocks.container).undefined;
  });

  it('should empty the Container if there is a single JS API Impl', async () => {
    const fixture = cloneFixture(singleJsApiImplCauldron);
    sandbox
      .stub(cauldronApi, 'getActiveCauldron')
      .resolves(createCauldronHelper(fixture));
    await emptyContainerIfSingleMiniAppOrJsApiImpl(
      AppVersionDescriptor.fromString('test:android:1.0.0'),
    );
    const version = jp.query(fixture, testAndroid100Path)[0];
    expect(version.container.jsApiImpls).empty;
    expect(version.container.nativeDeps).empty;
    expect(version.yarnLocks.container).undefined;
  });
});
