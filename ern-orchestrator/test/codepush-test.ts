import { assert, expect } from 'chai'
import sinon from 'sinon'
import jp from 'jsonpath'
import { NativeApplicationDescriptor, CodePushSdk, PackagePath } from 'ern-core'
import {
  CauldronApi,
  CauldronHelper,
  EphemeralFileStore,
  InMemoryDocumentStore,
} from 'ern-cauldron-api'
import * as containerGen from 'ern-container-gen'
import { doesThrow, doesNotThrow, fixtures } from 'ern-util-dev'
import * as core from 'ern-core'
import * as cauldronApi from 'ern-cauldron-api'
import * as sut from '../src/codepush'
import * as compatibility from '../src/compatibility'

const sandbox = sinon.createSandbox()

const testAndroid1770Path =
  '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")]'
const testAndroid1770Descriptor = NativeApplicationDescriptor.fromString(
  'test:android:17.7.0'
)
const testAndroid1780Descriptor = NativeApplicationDescriptor.fromString(
  'test:android:17.8.0'
)

let documentStore
let fileStore
let cauldronDoc

function createCauldronApi(cauldronDocument) {
  documentStore = new InMemoryDocumentStore(cauldronDocument)
  fileStore = new EphemeralFileStore()
  return new CauldronApi(documentStore, fileStore)
}

function createCauldronHelper(cauldronDocument) {
  return new CauldronHelper(createCauldronApi(cauldronDocument))
}

function cloneFixture(fixture) {
  return JSON.parse(JSON.stringify(fixture))
}

describe('codepush', () => {
  beforeEach(() => {
    cauldronDoc = cloneFixture(fixtures.defaultCauldron)
    const cauldronHelper = createCauldronHelper(cauldronDoc)
    sandbox.stub(cauldronApi, 'getActiveCauldron').resolves(cauldronHelper)
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('performCodePushPatch', () => {
    it('should call code push sdk patch metdod to patch isMandatory flag', async () => {
      const codePushSdkStub = sinon.createStubInstance(CodePushSdk)
      sandbox.stub(core, 'getCodePushSdk').returns(codePushSdkStub)

      await sut.performCodePushPatch(
        testAndroid1770Descriptor,
        'Production',
        'v17',
        {
          isMandatory: true,
        }
      )

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
        }
      )
    })

    it('should patch isMandatory flag in Cauldron CodePush entry', async () => {
      const codePushSdkStub = sinon.createStubInstance(CodePushSdk)
      sandbox.stub(core, 'getCodePushSdk').returns(codePushSdkStub)

      await sut.performCodePushPatch(
        testAndroid1770Descriptor,
        'Production',
        'v17',
        {
          isMandatory: true,
        }
      )
      const nativeAppVersion = jp.query(cauldronDoc, testAndroid1770Path)[0]
      const codePushEntry = nativeAppVersion.codePush.Production.find(
        c => c.metadata.label === 'v17'
      )
      expect(codePushEntry.metadata.isMandatory).true
    })

    it('should call code push sdk patch metdod to patch isDisabled flag', async () => {
      const codePushSdkStub = sinon.createStubInstance(CodePushSdk)
      sandbox.stub(core, 'getCodePushSdk').returns(codePushSdkStub)

      await sut.performCodePushPatch(
        testAndroid1770Descriptor,
        'Production',
        'v17',
        {
          isDisabled: true,
        }
      )

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
        }
      )
    })

    it('should patch isDisabled flag in Cauldron CodePush entry', async () => {
      const codePushSdkStub = sinon.createStubInstance(CodePushSdk)
      sandbox.stub(core, 'getCodePushSdk').returns(codePushSdkStub)

      await sut.performCodePushPatch(
        testAndroid1770Descriptor,
        'Production',
        'v17',
        {
          isDisabled: true,
        }
      )
      const nativeAppVersion = jp.query(cauldronDoc, testAndroid1770Path)[0]
      const codePushEntry = nativeAppVersion.codePush.Production.find(
        c => c.metadata.label === 'v17'
      )
      expect(codePushEntry.metadata.isDisabled).true
    })

    it('should patch rollout percentage in Cauldron CodePush entry', async () => {
      sandbox
        .stub(core, 'getCodePushSdk')
        .returns({ patch: async () => Promise.resolve(true) })
      await sut.performCodePushPatch(
        testAndroid1770Descriptor,
        'Production',
        'v17',
        {
          rollout: 50,
        }
      )
      const nativeAppVersion = jp.query(cauldronDoc, testAndroid1770Path)[0]
      const codePushEntry = nativeAppVersion.codePush.Production.find(
        c => c.metadata.label === 'v17'
      )
      expect(codePushEntry.metadata.rollout).eq(50)
    })

    it('should call code push sdk patch method to patch rollout percentage', async () => {
      const codePushSdkStub = sinon.createStubInstance(CodePushSdk)
      sandbox.stub(core, 'getCodePushSdk').returns(codePushSdkStub)

      await sut.performCodePushPatch(
        testAndroid1770Descriptor,
        'Production',
        'v17',
        {
          rollout: 50,
        }
      )

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
        }
      )
    })

    it('should not alter the Cauldron if call to code push sdk patch method is failing', async () => {
      const nativeAppVersionBefore = jp.query(
        cauldronDoc,
        testAndroid1770Path
      )[0]
      sandbox
        .stub(core, 'getCodePushSdk')
        .returns({ patch: async () => Promise.reject(new Error('Fail')) })
      try {
        await sut.performCodePushPatch(
          testAndroid1770Descriptor,
          'Production',
          'v17',
          {
            rollout: 50,
          }
        )
      } catch (e) {
        // swallow
      }
      const nativeAppVersionAfter = jp.query(
        cauldronDoc,
        testAndroid1770Path
      )[0]
      expect(nativeAppVersionAfter).deep.equal(nativeAppVersionBefore)
    })

    it('should throw if the call to code push sdk patch method is failing', async () => {
      sandbox
        .stub(core, 'getCodePushSdk')
        .returns({ patch: async () => Promise.reject(new Error('Fail')) })

      assert(
        await doesThrow(
          sut.performCodePushPatch,
          sut,
          testAndroid1770Descriptor,
          'Production',
          'v17',
          {
            rollout: 50,
          }
        )
      )
    })
  })

  describe('performCodePushPromote', () => {
    let codePushSdkStub

    function prepareStubs({
      compatibility_areCompatible = true,
    }: {
      compatibility_areCompatible?: boolean
    } = {}) {
      sandbox
        .stub(compatibility, 'areCompatible')
        .resolves(compatibility_areCompatible)
      codePushSdkStub = sinon.createStubInstance(CodePushSdk)
      sandbox.stub(core, 'getCodePushSdk').returns(codePushSdkStub)
      codePushSdkStub.promote.resolves({
        appVersion: '17.7',
        description: 'new description',
        isMandatory: false,
        label: 'v20',
        releaseMethod: 'Promote',
        releasedBy: 'unit@test.com',
        rollout: 100,
        size: 12345,
      })
    }

    it('should throw if one or more target descriptor does not include a version', async () => {
      prepareStubs()
      assert(
        await doesThrow(
          sut.performCodePushPromote,
          sut,
          testAndroid1770Descriptor,
          [NativeApplicationDescriptor.fromString('test:android')],
          'QA',
          'Production'
        )
      )
    })

    it('should throw if no matching source code push entry is not found in Cauldron', async () => {
      prepareStubs()
      assert(
        await doesThrow(
          sut.performCodePushPromote,
          sut,
          testAndroid1770Descriptor,
          [testAndroid1770Descriptor],
          'QA',
          'Production',
          {
            label: 'v50',
          }
        )
      )
    })

    it('should throw if some MiniApps include imcompatible native dependencies with target native application version and force flag is false', async () => {
      prepareStubs({
        compatibility_areCompatible: false,
      })

      assert(
        await doesThrow(
          sut.performCodePushPromote,
          sut,
          testAndroid1770Descriptor,
          [testAndroid1770Descriptor],
          'QA',
          'Production',
          {
            label: 'v18',
          }
        )
      )
    })

    it('should not throw if some MiniApps include imcompatible native dependencies with target native application version and force flag is true', async () => {
      prepareStubs({
        compatibility_areCompatible: false,
      })

      assert(
        await doesNotThrow(
          sut.performCodePushPromote,
          sut,
          testAndroid1770Descriptor,
          [testAndroid1770Descriptor],
          'QA',
          'Production',
          {
            force: true,
            label: 'v18',
          }
        )
      )
    })

    it('should call code push sdk promote method with correct arguments', async () => {
      prepareStubs()

      await sut.performCodePushPromote(
        testAndroid1770Descriptor,
        [testAndroid1770Descriptor],
        'QA',
        'Production',
        {
          label: 'v18',
          rollout: 100,
        }
      )

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
        }
      )
    })

    it('should add a code push entry in Cauldron', async () => {
      prepareStubs()

      await sut.performCodePushPromote(
        testAndroid1770Descriptor,
        [testAndroid1770Descriptor],
        'QA',
        'Production',
        {
          label: 'v18',
          rollout: 100,
        }
      )

      const nativeAppVersion = jp.query(cauldronDoc, testAndroid1770Path)[0]
      expect(
        nativeAppVersion.codePush.Production.find(
          c => c.metadata.label === 'v20'
        )
      ).not.undefined
    })

    it('should populate the CodePush entry with proper data in Cauldron', async () => {
      prepareStubs()

      await sut.performCodePushPromote(
        testAndroid1770Descriptor,
        [testAndroid1770Descriptor],
        'QA',
        'Production',
        {
          description: 'new description',
          label: 'v18',
          rollout: 100,
        }
      )

      const nativeAppVersion = jp.query(cauldronDoc, testAndroid1770Path)[0]
      const codePushEntry = nativeAppVersion.codePush.Production.find(
        c => c.metadata.label === 'v20'
      )
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
      })
    })

    it('should properly update target deployment yarn lock id in Cauldron', async () => {
      prepareStubs()

      await sut.performCodePushPromote(
        testAndroid1770Descriptor,
        [testAndroid1770Descriptor],
        'QA',
        'Production',
        {
          label: 'v18',
          rollout: 100,
        }
      )

      const nativeAppVersion = jp.query(cauldronDoc, testAndroid1770Path)[0]
      const yarnLockId = nativeAppVersion.yarnLocks.Production
      expect(yarnLockId).equal('31bf4e4f61386d71fe5d52e31a2c5abcbb31e33e')
    })

    it('should not alter the Cauldron if call to code push sdk promote method is failing', async () => {
      prepareStubs()
      codePushSdkStub.promote.rejects(new Error('fail'))

      const nativeAppVersionBefore = jp.query(
        cauldronDoc,
        testAndroid1770Path
      )[0]
      try {
        await sut.performCodePushPromote(
          testAndroid1770Descriptor,
          [testAndroid1770Descriptor],
          'QA',
          'Production',
          {
            label: 'v18',
            rollout: 100,
          }
        )
      } catch (e) {
        // swallow
      }
      const nativeAppVersionAfter = jp.query(
        cauldronDoc,
        testAndroid1770Path
      )[0]
      expect(nativeAppVersionAfter).deep.equal(nativeAppVersionBefore)
    })

    it('should throw if the call to code push sdk patch method is failing', async () => {
      prepareStubs()
      codePushSdkStub.promote.rejects(new Error('fail'))

      assert(
        await doesThrow(
          sut.performCodePushPromote,
          sut,
          testAndroid1770Descriptor,
          [testAndroid1770Descriptor],
          'QA',
          'Production',
          {
            label: 'v18',
            rollout: 100,
          }
        )
      )
    })
  })

  describe('performCodePushOtaUpdate', () => {
    let codePushSdkStub

    function prepareStubs({
      compatibility_areCompatible = true,
    }: {
      compatibility_areCompatible?: boolean
    } = {}) {
      sandbox
        .stub(compatibility, 'areCompatible')
        .resolves(compatibility_areCompatible)

      codePushSdkStub = sinon.createStubInstance(CodePushSdk)
      sandbox.stub(core, 'getCodePushSdk').returns(codePushSdkStub)
      sandbox.stub(containerGen, 'generateMiniAppsComposite').resolves()
      sandbox.stub(core.reactnative, 'bundle').resolves()
      codePushSdkStub.releaseReact.resolves({
        appVersion: '17.7.0',
        isMandatory: false,
        label: 'v20',
        releaseMethod: 'Upload',
        releasedBy: 'unit@test.com',
        rollout: 100,
        size: 12345,
      })
    }

    it('should throw if some MiniApps include imcompatible native dependencies with target native application version and force flag is false', async () => {
      prepareStubs({
        compatibility_areCompatible: false,
      })

      assert(
        await doesThrow(
          sut.performCodePushOtaUpdate,
          sut,
          testAndroid1770Descriptor,
          'Production',
          [PackagePath.fromString('react-native-bar@2.0.3')],
          [],
          {
            codePushRolloutPercentage: 100,
          }
        )
      )
    })

    it('should not throw if some MiniApps include imcompatible native dependencies with target native application version and force flag is true', async () => {
      prepareStubs({
        compatibility_areCompatible: false,
      })

      assert(
        await doesNotThrow(
          sut.performCodePushOtaUpdate,
          sut,
          testAndroid1770Descriptor,
          'Production',
          [PackagePath.fromString('react-native-bar@2.0.3')],
          [],
          {
            codePushRolloutPercentage: 100,
            force: true,
          }
        )
      )
    })

    it('should call code push sdk releaseReact method with correct arguments', async () => {
      prepareStubs()

      await sut.performCodePushOtaUpdate(
        testAndroid1770Descriptor,
        'Production',
        [PackagePath.fromString('react-native-bar@2.0.3')],
        [],
        {
          codePushRolloutPercentage: 100,
        }
      )

      sandbox.assert.calledWith(
        codePushSdkStub.releaseReact,
        'testAndroid',
        'Production',
        sinon.match.string,
        '17.7.0',
        { description: '', isMandatory: false, rollout: 100 }
      )
    })

    it('should add a code push entry in the Cauldron for target native application version', async () => {
      prepareStubs()

      await sut.performCodePushOtaUpdate(
        testAndroid1770Descriptor,
        'Production',
        [PackagePath.fromString('react-native-bar@2.0.3')],
        [],
        {
          codePushRolloutPercentage: 100,
        }
      )

      const nativeAppVersion = jp.query(cauldronDoc, testAndroid1770Path)[0]
      expect(
        nativeAppVersion.codePush.Production.find(
          c => c.metadata.label === 'v20'
        )
      ).not.undefined
    })

    it('should not alter the Cauldron if call to code push sdk promote method is failing', async () => {
      prepareStubs()
      codePushSdkStub.releaseReact.rejects(new Error('fail'))

      const nativeAppVersionBefore = jp.query(
        cauldronDoc,
        testAndroid1770Path
      )[0]
      try {
        await sut.performCodePushOtaUpdate(
          testAndroid1770Descriptor,
          'Production',
          [PackagePath.fromString('react-native-bar@2.0.3')],
          [],
          {
            codePushRolloutPercentage: 100,
          }
        )
      } catch (e) {
        // swallow
      }
      const nativeAppVersionAfter = jp.query(
        cauldronDoc,
        testAndroid1770Path
      )[0]
      expect(nativeAppVersionAfter).deep.equal(nativeAppVersionBefore)
    })

    it('should throw if the call to code push sdk patch method is failing', async () => {
      prepareStubs()
      codePushSdkStub.releaseReact.rejects(new Error('fail'))

      assert(
        await doesThrow(
          sut.performCodePushOtaUpdate,
          sut,
          testAndroid1770Descriptor,
          'Production',
          [PackagePath.fromString('react-native-bar@2.0.3')],
          [],
          {
            codePushRolloutPercentage: 100,
          }
        )
      )
    })
  })

  describe('getCodePushTargetVersionName', () => {
    it('should throw if the descriptor is missing the version', async () => {
      assert(
        await doesThrow(
          sut.getCodePushTargetVersionName,
          sut,
          NativeApplicationDescriptor.fromString('test:android'),
          'Production'
        )
      )
    })

    it('should return the native application version as such if no version modifiers are defined in the config', async () => {
      const result = await sut.getCodePushTargetVersionName(
        testAndroid1770Descriptor,
        'Production'
      )
      expect(result).equal('17.7.0')
    })

    it('should apply version modifiers if any', async () => {
      const result = await sut.getCodePushTargetVersionName(
        testAndroid1780Descriptor,
        'QA'
      )
      expect(result).equal('17.8.0-QA')
    })
  })

  describe('getCodePushAppName', () => {
    it('should return the default generated app name if code push config does not specify a specific one', async () => {
      const result = await sut.getCodePushAppName(testAndroid1770Descriptor)
      expect(result).equal('testAndroid')
    })

    it('should use the app name from config if any', async () => {
      const result = await sut.getCodePushAppName(testAndroid1780Descriptor)
      expect(result).equal('walmart-android')
    })
  })
})
