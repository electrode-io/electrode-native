import { assert, expect } from 'chai';
import sinon from 'sinon';
import jp from 'jsonpath';
import * as core from 'ern-core';
import { AppVersionDescriptor, CodePushSdk, PackagePath } from 'ern-core';
import * as cauldronApi from 'ern-cauldron-api';
import {
  CauldronApi,
  CauldronHelper,
  EphemeralFileStore,
  InMemoryDocumentStore,
} from 'ern-cauldron-api';
import * as compositeGen from 'ern-composite-gen';
import { GeneratedComposite } from 'ern-composite-gen';
import { rejects } from 'assert';
import { fixtures } from 'ern-util-dev';
import * as sut from '../src/codepush';
import * as compatibility from '../src/compatibility';
import path from 'path';

const sandbox = sinon.createSandbox();

const testAndroid1770Path =
  '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")]';
const testAndroid1770Descriptor = AppVersionDescriptor.fromString(
  'test:android:17.7.0',
);
const testAndroid1780Descriptor = AppVersionDescriptor.fromString(
  'test:android:17.8.0',
);

let documentStore;
let fileStore;
let cauldronDoc: any;

const cauldronApiFixtureFileStorePath = path.join(
  __dirname,
  '../../ern-cauldron-api/test/fixtures/filestore',
);

function createCauldronApi(cauldronDocument: any) {
  const fileStoreTmpDir = core.createTmpDir();
  core.shell.cp(
    '-rf',
    path.join(cauldronApiFixtureFileStorePath, '**'),
    fileStoreTmpDir,
  );
  documentStore = new InMemoryDocumentStore(cauldronDocument);
  fileStore = new EphemeralFileStore({ storePath: fileStoreTmpDir });
  return new CauldronApi(documentStore, fileStore);
}

function createCauldronHelper(cauldronDocument: any) {
  return new CauldronHelper(createCauldronApi(cauldronDocument));
}

function cloneFixture(fixture: any) {
  return JSON.parse(JSON.stringify(fixture));
}

describe('codepush', () => {
  beforeEach(() => {
    cauldronDoc = cloneFixture(fixtures.defaultCauldron);
    const cauldronHelper = createCauldronHelper(cauldronDoc);
    sandbox.stub(cauldronApi, 'getActiveCauldron').resolves(cauldronHelper);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('performCodePushPatch', () => {
    it('should call code push sdk patch method to patch isMandatory flag', async () => {
      const codePushSdkStub = sinon.createStubInstance(CodePushSdk);
      sandbox.stub(core, 'getCodePushSdk').returns(codePushSdkStub);

      await sut.performCodePushPatch(
        testAndroid1770Descriptor,
        'Production',
        'v17',
        {
          isMandatory: true,
        },
      );

      sandbox.assert.calledWith(
        codePushSdkStub.patch,
        'testAndroid',
        'Production',
        {
          description: '',
          isDisabled: undefined,
          isMandatory: true,
          label: 'v17',
          rollout: undefined,
        },
      );
    });

    it('should patch isMandatory flag in Cauldron CodePush entry', async () => {
      const codePushSdkStub = sinon.createStubInstance(CodePushSdk);
      sandbox.stub(core, 'getCodePushSdk').returns(codePushSdkStub);

      await sut.performCodePushPatch(
        testAndroid1770Descriptor,
        'Production',
        'v17',
        {
          isMandatory: true,
        },
      );
      const nativeAppVersion = jp.query(cauldronDoc, testAndroid1770Path)[0];
      const codePushEntry = nativeAppVersion.codePush.Production.find(
        (c) => c.metadata.label === 'v17',
      );
      expect(codePushEntry.metadata.isMandatory).true;
    });

    it('should call code push sdk patch method to patch isDisabled flag', async () => {
      const codePushSdkStub = sinon.createStubInstance(CodePushSdk);
      sandbox.stub(core, 'getCodePushSdk').returns(codePushSdkStub);

      await sut.performCodePushPatch(
        testAndroid1770Descriptor,
        'Production',
        'v17',
        {
          isDisabled: true,
        },
      );

      sandbox.assert.calledWith(
        codePushSdkStub.patch,
        'testAndroid',
        'Production',
        {
          description: '',
          isDisabled: true,
          isMandatory: undefined,
          label: 'v17',
          rollout: undefined,
        },
      );
    });

    it('should patch isDisabled flag in Cauldron CodePush entry', async () => {
      const codePushSdkStub = sinon.createStubInstance(CodePushSdk);
      sandbox.stub(core, 'getCodePushSdk').returns(codePushSdkStub);

      await sut.performCodePushPatch(
        testAndroid1770Descriptor,
        'Production',
        'v17',
        {
          isDisabled: true,
        },
      );
      const nativeAppVersion = jp.query(cauldronDoc, testAndroid1770Path)[0];
      const codePushEntry = nativeAppVersion.codePush.Production.find(
        (c) => c.metadata.label === 'v17',
      );
      expect(codePushEntry.metadata.isDisabled).true;
    });

    it('should patch rollout percentage in Cauldron CodePush entry', async () => {
      sandbox
        .stub(core, 'getCodePushSdk')
        .returns({ patch: async () => Promise.resolve(true) });
      await sut.performCodePushPatch(
        testAndroid1770Descriptor,
        'Production',
        'v17',
        {
          rollout: 50,
        },
      );
      const nativeAppVersion = jp.query(cauldronDoc, testAndroid1770Path)[0];
      const codePushEntry = nativeAppVersion.codePush.Production.find(
        (c) => c.metadata.label === 'v17',
      );
      expect(codePushEntry.metadata.rollout).eq(50);
    });

    it('should call code push sdk patch method to patch rollout percentage', async () => {
      const codePushSdkStub = sinon.createStubInstance(CodePushSdk);
      sandbox.stub(core, 'getCodePushSdk').returns(codePushSdkStub);

      await sut.performCodePushPatch(
        testAndroid1770Descriptor,
        'Production',
        'v17',
        {
          rollout: 50,
        },
      );

      sandbox.assert.calledWith(
        codePushSdkStub.patch,
        'testAndroid',
        'Production',
        {
          description: '',
          isDisabled: undefined,
          isMandatory: undefined,
          label: 'v17',
          rollout: 50,
        },
      );
    });

    it('should not alter the Cauldron if call to code push sdk patch method is failing', async () => {
      const nativeAppVersionBefore = jp.query(
        cauldronDoc,
        testAndroid1770Path,
      )[0];
      sandbox
        .stub(core, 'getCodePushSdk')
        .returns({ patch: async () => Promise.reject(new Error('Fail')) });
      try {
        await sut.performCodePushPatch(
          testAndroid1770Descriptor,
          'Production',
          'v17',
          {
            rollout: 50,
          },
        );
      } catch (e) {
        // swallow
      }
      const nativeAppVersionAfter = jp.query(
        cauldronDoc,
        testAndroid1770Path,
      )[0];
      expect(nativeAppVersionAfter).deep.equal(nativeAppVersionBefore);
    });

    it('should throw if the call to code push sdk patch method is failing', async () => {
      sandbox
        .stub(core, 'getCodePushSdk')
        .returns({ patch: async () => Promise.reject(new Error('Fail')) });

      assert(
        rejects(
          sut.performCodePushPatch(
            testAndroid1770Descriptor,
            'Production',
            'v17',
            {
              rollout: 50,
            },
          ),
        ),
      );
    });
  });

  describe('performCodePushPromote', () => {
    let codePushSdkStub: any;

    function prepareStubs({
      compatibility_areCompatible = true,
    }: {
      compatibility_areCompatible?: boolean;
    } = {}) {
      sandbox
        .stub(compatibility, 'areCompatible')
        .resolves(compatibility_areCompatible);
      codePushSdkStub = sinon.createStubInstance(CodePushSdk);
      sandbox.stub(core, 'getCodePushSdk').returns(codePushSdkStub);
      codePushSdkStub.promote.resolves({
        appVersion: '17.7',
        description: 'new description',
        isMandatory: false,
        label: 'v20',
        releaseMethod: 'Promote',
        releasedBy: 'unit@test.com',
        rollout: 100,
        size: 12345,
      });
    }

    it('should throw if no matching source code push entry is not found in Cauldron', async () => {
      prepareStubs();
      assert(
        rejects(
          sut.performCodePushPromote(
            testAndroid1770Descriptor,
            [testAndroid1770Descriptor],
            'QA',
            'Production',
            {
              label: 'v50',
            },
          ),
        ),
      );
    });

    it('should skip native dependencies compatibility check if source and target version promoted are same', async () => {
      prepareStubs({
        compatibility_areCompatible: false,
      });

      await sut.performCodePushPromote(
        testAndroid1770Descriptor,
        [testAndroid1770Descriptor],
        'QA',
        'Production',
        {
          label: 'v18',
        },
      );
    });

    it('should skip native dependencies compatibility check if skipNativeDependenciesVersionAlignedCheck is set to true', async () => {
      prepareStubs({
        compatibility_areCompatible: false,
      });

      await sut.performCodePushPromote(
        testAndroid1770Descriptor,
        [testAndroid1780Descriptor],
        'QA',
        'Production',
        {
          label: 'v18',
          skipNativeDependenciesVersionAlignedCheck: true,
        },
      );
    });

    it('should throw if some MiniApps include incompatible native dependencies with target native application version and force flag is false', async () => {
      prepareStubs({
        compatibility_areCompatible: false,
      });

      assert(
        rejects(
          sut.performCodePushPromote(
            testAndroid1770Descriptor,
            [testAndroid1780Descriptor],
            'QA',
            'Production',
            {
              label: 'v18',
            },
          ),
        ),
      );
    });

    it('should not throw if some MiniApps include incompatible native dependencies with target native application version and force flag is true', async () => {
      prepareStubs({
        compatibility_areCompatible: false,
      });

      await sut.performCodePushPromote(
        testAndroid1770Descriptor,
        [testAndroid1780Descriptor],
        'QA',
        'Production',
        {
          force: true,
          label: 'v18',
        },
      );
    });

    it('should call code push sdk promote method with correct arguments', async () => {
      prepareStubs();

      await sut.performCodePushPromote(
        testAndroid1770Descriptor,
        [testAndroid1770Descriptor],
        'QA',
        'Production',
        {
          label: 'v18',
          rollout: 100,
        },
      );

      sandbox.assert.calledWith(
        codePushSdkStub.promote,
        'testAndroid',
        'QA',
        'Production',
        {
          appVersion: '17.7.0',
          description: '',
          isMandatory: false,
          label: 'v18',
          rollout: 100,
        },
        false,
      );
    });

    it('should add a code push entry in Cauldron', async () => {
      prepareStubs();

      await sut.performCodePushPromote(
        testAndroid1770Descriptor,
        [testAndroid1770Descriptor],
        'QA',
        'Production',
        {
          label: 'v18',
          rollout: 100,
        },
      );

      const nativeAppVersion = jp.query(cauldronDoc, testAndroid1770Path)[0];
      expect(
        nativeAppVersion.codePush.Production.find(
          (c: any) => c.metadata.label === 'v20',
        ),
      ).not.undefined;
    });

    it('should populate the CodePush entry with proper data in Cauldron', async () => {
      prepareStubs();

      await sut.performCodePushPromote(
        testAndroid1770Descriptor,
        [testAndroid1770Descriptor],
        'QA',
        'Production',
        {
          description: 'new description',
          label: 'v18',
          rollout: 100,
        },
      );

      const nativeAppVersion = jp.query(cauldronDoc, testAndroid1770Path)[0];
      const codePushEntry = nativeAppVersion.codePush.Production.find(
        (c: any) => c.metadata.label === 'v20',
      );
      expect(codePushEntry).to.deep.equal({
        jsApiImpls: ['react-native-my-api-impl@1.1.0'],
        metadata: {
          appVersion: '17.7',
          deploymentName: 'Production',
          description: 'new description',
          isMandatory: false,
          label: 'v20',
          promotedFromLabel: 'v18',
          releaseMethod: 'Promote',
          releasedBy: 'unit@test.com',
          rollout: 100,
          size: 12345,
        },
        miniapps: ['@test/react-native-foo@4.0.3', 'react-native-bar@2.0.2'],
      });
    });

    it('should reuse the initial release binary version if reuseReleaseBinaryVersion is set', async () => {
      prepareStubs();

      await sut.performCodePushPromote(
        testAndroid1770Descriptor,
        [testAndroid1770Descriptor],
        'QA',
        'Production',
        {
          description: 'new description',
          label: 'v18',
          reuseReleaseBinaryVersion: true,
          rollout: 100,
        },
      );

      sandbox.assert.calledWith(
        codePushSdkStub.promote,
        'testAndroid',
        'QA',
        'Production',
        {
          appVersion: '~17.7',
          description: 'new description',
          isMandatory: false,
          label: 'v18',
          rollout: 100,
        },
        false,
      );
    });

    it('should not reuse the initial release binary version if reuseReleaseBinaryVersion is not set', async () => {
      prepareStubs();

      await sut.performCodePushPromote(
        testAndroid1770Descriptor,
        [testAndroid1770Descriptor],
        'QA',
        'Production',
        {
          description: 'new description',
          disableDuplicateReleaseError: true,
          label: 'v18',
          rollout: 100,
        },
      );

      sandbox.assert.calledWith(
        codePushSdkStub.promote,
        'testAndroid',
        'QA',
        'Production',
        {
          appVersion: '17.7.0',
          description: 'new description',
          isMandatory: false,
          label: 'v18',
          rollout: 100,
        },
        true,
      );
    });

    it('should throw if both reuseReleaseBinaryVersion and targetBinaryVersion are set', async () => {
      prepareStubs();
      codePushSdkStub.promote.rejects(new Error('fail'));

      assert(
        rejects(
          sut.performCodePushPromote(
            testAndroid1770Descriptor,
            [testAndroid1770Descriptor],
            'QA',
            'Production',
            {
              label: 'v18',
              reuseReleaseBinaryVersion: true,
              rollout: 100,
              targetBinaryVersion: '17.7.0',
            },
          ),
        ),
      );
    });

    it('should properly update target deployment yarn lock id in Cauldron', async () => {
      prepareStubs();

      await sut.performCodePushPromote(
        testAndroid1770Descriptor,
        [testAndroid1770Descriptor],
        'QA',
        'Production',
        {
          label: 'v18',
          rollout: 100,
        },
      );

      const nativeAppVersion = jp.query(cauldronDoc, testAndroid1770Path)[0];
      const yarnLockId = nativeAppVersion.yarnLocks.Production;
      expect(yarnLockId).equal('2ce473a0-0bcc-4727-a72b-5bcd8bbb4ec9');
    });

    it('should not alter the Cauldron if call to code push sdk promote method is failing', async () => {
      prepareStubs();
      codePushSdkStub.promote.rejects(new Error('fail'));

      const nativeAppVersionBefore = jp.query(
        cauldronDoc,
        testAndroid1770Path,
      )[0];
      try {
        await sut.performCodePushPromote(
          testAndroid1770Descriptor,
          [testAndroid1770Descriptor],
          'QA',
          'Production',
          {
            label: 'v18',
            rollout: 100,
          },
        );
      } catch (e) {
        // swallow
      }
      const nativeAppVersionAfter = jp.query(
        cauldronDoc,
        testAndroid1770Path,
      )[0];
      expect(nativeAppVersionAfter).deep.equal(nativeAppVersionBefore);
    });

    it('should throw if the call to code push sdk patch method is failing', async () => {
      prepareStubs();
      codePushSdkStub.promote.rejects(new Error('fail'));

      assert(
        rejects(
          sut.performCodePushPromote(
            testAndroid1770Descriptor,
            [testAndroid1770Descriptor],
            'QA',
            'Production',
            {
              label: 'v18',
              rollout: 100,
            },
          ),
        ),
      );
    });
  });

  describe('performCodePushOtaUpdate', () => {
    let codePushSdkStub: any;

    function prepareStubs({
      compatibility_areCompatible = true,
    }: {
      compatibility_areCompatible?: boolean;
    } = {}) {
      sandbox
        .stub(compatibility, 'areCompatible')
        .resolves(compatibility_areCompatible);

      sandbox
        .stub(GeneratedComposite, 'generate')
        .callsFake(() => Promise.resolve({}));
      codePushSdkStub = sinon.createStubInstance(CodePushSdk);
      sandbox.stub(core, 'getCodePushSdk').returns(codePushSdkStub);
      sandbox.stub(compositeGen, 'generateComposite').resolves();
      sandbox.stub(core.reactnative, 'bundle').resolves();
      codePushSdkStub.releaseReact.resolves({
        appVersion: '17.7.0',
        isMandatory: false,
        label: 'v20',
        releaseMethod: 'Upload',
        releasedBy: 'unit@test.com',
        rollout: 100,
        size: 12345,
      });
    }

    it('should throw if some MiniApps include incompatible native dependencies with target native application version and force flag is false', async () => {
      prepareStubs({
        compatibility_areCompatible: false,
      });

      assert(
        rejects(
          sut.performCodePushOtaUpdate(
            testAndroid1770Descriptor,
            'Production',
            [PackagePath.fromString('react-native-bar@2.0.3')],
            [],
            {
              codePushRolloutPercentage: 100,
            },
          ),
        ),
      );
    });

    it('should not throw if some MiniApps include incompatible native dependencies with target native application version and force flag is true', async () => {
      prepareStubs({
        compatibility_areCompatible: false,
      });

      await sut.performCodePushOtaUpdate(
        testAndroid1770Descriptor,
        'Production',
        [PackagePath.fromString('react-native-bar@2.0.3')],
        [],
        {
          codePushRolloutPercentage: 100,
          force: true,
        },
      );
    });

    it('should call code push sdk releaseReact method with correct arguments', async () => {
      prepareStubs();

      await sut.performCodePushOtaUpdate(
        testAndroid1770Descriptor,
        'Production',
        [PackagePath.fromString('react-native-bar@2.0.3')],
        [],
        {
          codePushRolloutPercentage: 100,
        },
      );

      sandbox.assert.calledWith(
        codePushSdkStub.releaseReact,
        'testAndroid',
        'Production',
        sinon.match.string,
        '17.7.0',
        {
          description: '',
          isMandatory: false,
          rollout: 100,
        },
        false,
      );
    });

    it('should add a code push entry in the Cauldron for target native application version', async () => {
      prepareStubs();

      await sut.performCodePushOtaUpdate(
        testAndroid1770Descriptor,
        'Production',
        [PackagePath.fromString('react-native-bar@2.0.3')],
        [],
        {
          codePushRolloutPercentage: 100,
        },
      );

      const nativeAppVersion = jp.query(cauldronDoc, testAndroid1770Path)[0];
      expect(
        nativeAppVersion.codePush.Production.find(
          (c: any) => c.metadata.label === 'v20',
        ),
      ).not.undefined;
    });

    it('should not alter the Cauldron if call to code push sdk promote method is failing', async () => {
      prepareStubs();
      codePushSdkStub.releaseReact.rejects(new Error('fail'));

      const nativeAppVersionBefore = jp.query(
        cauldronDoc,
        testAndroid1770Path,
      )[0];
      try {
        await sut.performCodePushOtaUpdate(
          testAndroid1770Descriptor,
          'Production',
          [PackagePath.fromString('react-native-bar@2.0.3')],
          [],
          {
            codePushRolloutPercentage: 100,
          },
        );
      } catch (e) {
        // swallow
      }
      const nativeAppVersionAfter = jp.query(
        cauldronDoc,
        testAndroid1770Path,
      )[0];
      expect(nativeAppVersionAfter).deep.equal(nativeAppVersionBefore);
    });

    it('should throw if the call to code push sdk patch method is failing', async () => {
      prepareStubs();
      codePushSdkStub.releaseReact.rejects(new Error('fail'));

      assert(
        rejects(
          sut.performCodePushOtaUpdate(
            testAndroid1770Descriptor,
            'Production',
            [PackagePath.fromString('react-native-bar@2.0.3')],
            [],
            {
              codePushRolloutPercentage: 100,
            },
          ),
        ),
      );
    });
  });

  describe('buildCodePushTargetBinaryVersion', () => {
    it('should return the native application version as such if no version modifiers are defined in the config', async () => {
      const result = await sut.buildCodePushTargetBinaryVersion(
        testAndroid1770Descriptor,
        'Production',
      );
      expect(result).equal('17.7.0');
    });

    it('should apply version modifiers if any', async () => {
      const result = await sut.buildCodePushTargetBinaryVersion(
        testAndroid1780Descriptor,
        'QA',
      );
      expect(result).equal('17.8.0-QA');
    });
  });

  describe('applyVersionModifiers', () => {
    it('should return the unmodified target binary version if no version modifier applies', () => {
      const result = sut.applyVersionModifiers({
        deploymentName: 'Production',
        targetBinaryVersion: '1.0.0',
        versionModifiers: [
          {
            deploymentName: 'Staging',
            modifier: '$1-staging',
          },
        ],
      });
      expect(result).equal('1.0.0');
    });

    it('should return the modified target binary version if a version modifier applies', () => {
      const result = sut.applyVersionModifiers({
        deploymentName: 'Staging',
        targetBinaryVersion: '1.0.0',
        versionModifiers: [
          {
            deploymentName: 'Staging',
            modifier: '$1-staging',
          },
        ],
      });
      expect(result).equal('1.0.0-staging');
    });
  });

  describe('removeZeroPatchDigit', () => {
    const x: Array<[string, string]> = [
      ['1.0.0', '1.0'],
      ['1.0.0-beta', '1.0-beta'],
      ['1.0.0-beta.1', '1.0-beta.1'],
      ['1.0.0-beta-1', '1.0-beta-1'],
    ];
    for (const [targetBinaryVersion, expectedOutput] of x) {
      it(`should properly remove patch digit from version ${targetBinaryVersion}`, () => {
        const result = sut.removeZeroPatchDigit({
          targetBinaryVersion,
        });
        expect(result).equal(expectedOutput);
      });
    }
  });

  describe('getCodePushAppName', () => {
    it('should return the default generated app name if code push config does not specify a specific one', async () => {
      const result = await sut.getCodePushAppName(testAndroid1770Descriptor);
      expect(result).equal('testAndroid');
    });

    it('should use the app name from config if any', async () => {
      const result = await sut.getCodePushAppName(testAndroid1780Descriptor);
      expect(result).equal('app-android');
    });
  });
});
