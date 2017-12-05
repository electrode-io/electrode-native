import {
  assert,
  expect
} from 'chai'
import CauldronHelper from '../src/CauldronHelper'
import sinon from 'sinon'
import { 
  Dependency,
  NativeApplicationDescriptor
} from 'ern-util'
import {
  doesThrow,
  doesNotThrow,
  beforeTest,
  afterTest,
  stubs,
  fixtures
} from 'ern-util-dev'
import { 
  CauldronApi,
  EphemeralFileStore,
  InMemoryDocumentStore
} from 'ern-cauldron-api'
import jp from 'jsonpath'
import path from 'path'
import mockFs from 'mock-fs'
import { nativeApplication } from '../../ern-cauldron-api/dist/schemas';

const codePushEntryFixtureOne =  {
  metadata: {
    deploymentName: "Production",
    isMandatory: false,
    appVersion: "17.7",
    size: 522946,
    releaseMethod: "Upload",
    label: "v18",
    releasedBy: "lemaireb@gmail.com",
    rollout: 100
  },
  miniapps: [
    "code-push-test-miniapp@0.0.19"
  ]
}

const codePushEntryFixtureTwo = {
  metadata: {
    deploymentName: "Production",
    isMandatory: false,
    appVersion: "17.7",
    size: 522946,
    releaseMethod: "Upload",
    label: "v19",
    releasedBy: "lemaireb@gmail.com",
    rollout: 100
  },
  miniapps: [
    "code-push-test-miniapp@0.0.20"
  ]
}

const codePushMetadataFixtureOne = {
    deploymentName: "Production",
    isMandatory: true,
    appVersion: "17.7",
    size: 522947,
    releaseMethod: "Upload",
    label: "v20",
    releasedBy: "lemaireb@gmail.com",
    rollout: 100
}

const codePushMetadataFixtureTwo = {
  deploymentName: "Staging",
  isMandatory: true,
  appVersion: "17.7",
  size: 522947,
  releaseMethod: "Upload",
  label: "v20",
  releasedBy: "lemaireb@gmail.com",
  rollout: 100
}

const miniAppsFixtureOne = [ Dependency.fromString('code-push-test-miniapp@0.0.22') ]

let cauldronHelper
let documentStore

function createCauldronApi(cauldronDocument) {
  documentStore = new InMemoryDocumentStore(cauldronDocument)
  const sourceMapStore = new EphemeralFileStore()
  const yarnLockStore = new EphemeralFileStore()
  return new CauldronApi(documentStore, sourceMapStore, yarnLockStore)
}

function createCauldronHelper(cauldronDocument) {
  return new CauldronHelper(createCauldronApi(cauldronDocument))
}

function cloneFixture(fixture) {
  return JSON.parse(JSON.stringify(fixture))
}

const testAndroid1770Path = '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")]'
const testAndroid1780Path = '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.8.0")]'

describe('CauldronHelper.js', () => {
  beforeEach(() => {
    beforeTest()
  })

  afterEach(() => {
    afterTest()
    mockFs.restore()
  })

  describe('constructor', () => {
    it('should throw if no CauldronApi instance is provided', () => {
      expect(() => new CauldronHelper()).to.throw()
    })

    it('should thro if a null CauldronApi instance is provided', () => {
      expect(() => new CauldronHelper(null)).to.throw()
    })

    it('should not throw if a CauldronApi instance is provided', () => {
      expect(() => new CauldronHelper(createCauldronApi({}))).to.not.throw()
    })
  })

  describe('addNativeApp', () => {
    it('should create a native application entry', async () => {
      const fixture = cloneFixture(fixtures.emptyCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      await cauldronHelper.addNativeApp(NativeApplicationDescriptor.fromString('myapp'))
      expect(fixture.nativeApps).to.be.an('array').of.length(1)
      expect(fixture.nativeApps[0].name).eql('myapp')
    })

    it('should create a native application and platform entry', async () => {
      const fixture = cloneFixture(fixtures.emptyCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      await cauldronHelper.addNativeApp(NativeApplicationDescriptor.fromString('myapp:android'))
      expect(fixture.nativeApps[0].platforms).to.be.an('array').of.length(1)
      expect(fixture.nativeApps[0].platforms[0].name).eql('android')
    })

    it('should create a native application and platform and version entry', async () => {
      const fixture = cloneFixture(fixtures.emptyCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      await cauldronHelper.addNativeApp(NativeApplicationDescriptor.fromString('myapp:android:1.0.0'), '0.10.0')
      expect(fixture.nativeApps[0].platforms[0].versions).to.be.an('array').of.length(1)
      expect(fixture.nativeApps[0].platforms[0].versions[0].name).eql('1.0.0')
    })
  })

  describe('removeNativeApp', () => {
    it('should remove a top level native app', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      await cauldronHelper.removeNativeApp(NativeApplicationDescriptor.fromString('test'))
      const result = jp.query(fixture, '$.nativeApps[?(@.name=="test")]')[0]
      expect(result).to.be.undefined
    })

    it('should remove a native application platform', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      await cauldronHelper.removeNativeApp(NativeApplicationDescriptor.fromString('test:android'))
      const result = jp.query(fixture, '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")]')[0]
      expect(result).to.be.undefined
    })

    it('should remove a native application version', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      await cauldronHelper.removeNativeApp(NativeApplicationDescriptor.fromString('test:android:17.7.0'))
      const result = jp.query(fixture, testAndroid1770Path)[0]
      expect(result).to.be.undefined
    })
  })

  describe('isNativeApplicationInCauldron', () => {
    it('should return true when querying an existing top level native app', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      const result = await cauldronHelper.isNativeApplicationInCauldron(NativeApplicationDescriptor.fromString('test'))
      expect(result).true
    })

    it('should return false when querying a non existing top level native app', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      const result = await cauldronHelper.isNativeApplicationInCauldron(NativeApplicationDescriptor.fromString('foo'))
      expect(result).false
    })

    it('should return true when querying an existing top level native app platform', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      const result = await cauldronHelper.isNativeApplicationInCauldron(NativeApplicationDescriptor.fromString('test:android'))
      expect(result).true
    })

    it('should return false when querying a non existing top level native app platform', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      const result = await cauldronHelper.isNativeApplicationInCauldron(NativeApplicationDescriptor.fromString('test:foo'))
      expect(result).false
    })

    it('should return true when querying an existing top level native app version', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      const result = await cauldronHelper.isNativeApplicationInCauldron(NativeApplicationDescriptor.fromString('test:android:17.7.0'))
      expect(result).true
    })

    it('should return false when querying a non existing top level native app version', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      const result = await cauldronHelper.isNativeApplicationInCauldron(NativeApplicationDescriptor.fromString('test:android:0.0.0'))
      expect(result).false
    })
  })

  describe('addNativeDependency', () => {
    it('should throw if the given native application descriptor is partial', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      assert(doesThrow(
        cauldronHelper.addNativeDependency, 
        NativeApplicationDescriptor.fromString('test:android'),
        Dependency.fromString('test@1.0.0')))
    })

    it('should throw if the given native application descriptor is not in Cauldron', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      assert(doesThrow(
        cauldronHelper.addNativeDependency, 
        NativeApplicationDescriptor.fromString('test:android:0.0.0'),
        Dependency.fromString('test@1.0.0')))
    })

    it('should throw if the given native application version is released', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      assert(doesThrow(
        cauldronHelper.addNativeDependency, 
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        Dependency.fromString('test@1.0.0')))
    })

    it('should add the dependency to the native application version', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      await cauldronHelper.addNativeDependency(
        NativeApplicationDescriptor.fromString('test:android:17.8.0'),
        Dependency.fromString('test@1.0.0'))
      const nativeAppVersion = jp.query(fixture, testAndroid1780Path)[0]
      expect(nativeAppVersion.nativeDeps.includes('test@1.0.0')).true
    })
  })

  describe('removeNativeDependency', () => {
    it('should throw if the given native application descriptor is partial', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      assert(doesThrow(
        cauldronHelper.removeNativeDependency, 
        NativeApplicationDescriptor.fromString('test:android'),
        Dependency.fromString('test@1.0.0')))
    })

    it('should throw if the given native application descriptor is not in Cauldron', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      assert(doesThrow(
        cauldronHelper.removeNativeDependency, 
        NativeApplicationDescriptor.fromString('test:android:0.0.0'),
        Dependency.fromString('test@1.0.0')))
    })

    it('should throw if the given native application version is released', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      assert(doesThrow(
        cauldronHelper.removeNativeDependency, 
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        Dependency.fromString('test@1.0.0')))
    })

    it('should remove the dependency from the native application version [1]', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      await cauldronHelper.removeNativeDependency(
        NativeApplicationDescriptor.fromString('test:android:17.8.0'),
        Dependency.fromString('react-native-electrode-bridge@1.4.9'))
      const nativeAppVersion = jp.query(fixture, testAndroid1780Path)[0]
      expect(nativeAppVersion.nativeDeps.includes('react-native-electrode-bridge@1.4.9')).false
    })

    it('should remove the dependency from the native application version [2]', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      await cauldronHelper.removeNativeDependency(
        NativeApplicationDescriptor.fromString('test:android:17.8.0'),
        Dependency.fromString('react-native-electrode-bridge'))
      const nativeAppVersion = jp.query(fixture, testAndroid1780Path)[0]
      expect(nativeAppVersion.nativeDeps.includes('react-native-electrode-bridge@1.4.9')).false
    })
  })

  describe('removeMiniAppFromContainer', () => {
    it('should throw if the given native application descriptor is partial', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      assert(doesThrow(
        cauldronHelper.removeMiniAppFromContainer, 
        NativeApplicationDescriptor.fromString('test:android'),
        Dependency.fromString('@test/react-native-foo@5.0.0')))
    })

    it('should throw if the given native application descriptor is not in Cauldron', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      assert(doesThrow(
        cauldronHelper.removeMiniAppFromContainer, 
        NativeApplicationDescriptor.fromString('test:android:0.0.0'),
        Dependency.fromString('@test/react-native-foo@5.0.0')))
    })

    it('should throw if the given native application version is released', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      assert(doesThrow(
        cauldronHelper.removeMiniAppFromContainer, 
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        Dependency.fromString('@test/react-native-foo@5.0.0')))
    })

    it('should remove the miniapp from the native application version [1]', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      await cauldronHelper.removeMiniAppFromContainer(
        NativeApplicationDescriptor.fromString('test:android:17.8.0'),
        Dependency.fromString('@test/react-native-foo@5.0.0'))
      const nativeAppVersion = jp.query(fixture, testAndroid1780Path)[0]
      expect(nativeAppVersion.nativeDeps.includes('@test/react-native-foo@5.0.0')).false
    })

    it('should remove the miniapp from the native application version [2]', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      await cauldronHelper.removeMiniAppFromContainer(
        NativeApplicationDescriptor.fromString('test:android:17.8.0'),
        Dependency.fromString('@test/react-native-foo'))
      const nativeAppVersion = jp.query(fixture, testAndroid1780Path)[0]
      expect(nativeAppVersion.nativeDeps.includes('@test/react-native-foo@5.0.0')).false
    })
  })

  describe('getNativeApp', () => {
    it('should return undefined if no top level application is found', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      const result = await cauldronHelper.getNativeApp(NativeApplicationDescriptor.fromString('foo'))
      expect(result).undefined
    })

    it('should return a top level native app', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      const result = await cauldronHelper.getNativeApp(NativeApplicationDescriptor.fromString('test'))
      expect(result).to.be.an('object')
      expect(result.name).eql('test')
    })

    it('should return undefined if no application platform is found', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      const result = await cauldronHelper.getNativeApp(NativeApplicationDescriptor.fromString('test:foo'))
      expect(result).undefined
    })

    it('should return a native app platform', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      const result = await cauldronHelper.getNativeApp(NativeApplicationDescriptor.fromString('test:android'))
      expect(result).to.be.an('object')
      expect(result.name).eql('android')
    })

    it('should return undefined if no application version is found', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      const result = await cauldronHelper.getNativeApp(NativeApplicationDescriptor.fromString('test:android:0.0.0'))
      expect(result).undefined
    })

    it('should return a native app version', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      const result = await cauldronHelper.getNativeApp(NativeApplicationDescriptor.fromString('test:android:17.7.0'))
      expect(result).to.be.an('object')
      expect(result.name).eql('17.7.0')
    })
  })

  describe('getVersions', () => {
    it('should throw if the descriptor does not contain a platform', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      assert(doesThrow(
        cauldronHelper.getVersions, 
        NativeApplicationDescriptor.fromString('test')))
    })

    it('should return all the versions', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      const result = await cauldronHelper.getVersions(
        NativeApplicationDescriptor.fromString('test:android'))
      expect(result).to.be.an('array').of.length(2)
    })
  })

  describe('getVersionsNames', () => {
    it('should return all version names', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      const result = await cauldronHelper.getVersionsNames(
        NativeApplicationDescriptor.fromString('test:android'))
      expect(result).to.be.an('array').of.length(2)
      expect(result[0]).eql('17.7.0')
      expect(result[1]).eql('17.8.0')
    })
  })

  describe('getNativeDependencies', () => {
    it('should throw if the given native application descriptor is partial', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      assert(doesThrow(
        cauldronHelper.getNativeDependencies, 
        NativeApplicationDescriptor.fromString('test:android')))
    })

    it('should return the native dependencies', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      const result = await cauldronHelper.getNativeDependencies(NativeApplicationDescriptor.fromString('test:android:17.7.0'))
      expect(result).to.be.an('array').of.length(4)
    })
  })

  describe('hasYarnLock', () => {
    it('should throw if the given native application descriptor is partial', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      assert(doesThrow(
        cauldronHelper.hasYarnLock, 
        NativeApplicationDescriptor.fromString('test:android'),
        'Production'))
    })

    it('should throw if the given native application descriptor is not in Cauldron', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      assert(doesThrow(
        cauldronHelper.hasYarnLock, 
        NativeApplicationDescriptor.fromString('test:android:0.0.0'),
        'Production'))
    })

    it('should return true if the yarn lock exists', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      const result = await cauldronHelper.hasYarnLock(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        'Production')
      expect(result).true
    })

    it('should return true if the yarn lock does not exists', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      const result = await cauldronHelper.hasYarnLock(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        'Foo')
      expect(result).false
    })
  })

  describe('addYarnLock', () => {
    it('should throw if the given native application descriptor is partial', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      assert(doesThrow(
        cauldronHelper.addYarnLock, 
        NativeApplicationDescriptor.fromString('test:android'),
        'Production'))
    })

    it('should throw if the given native application descriptor is not in Cauldron', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      assert(doesThrow(
        cauldronHelper.addYarnLock, 
        NativeApplicationDescriptor.fromString('test:android:0.0.0'),
        'Production'))
    })

    it('should add the yarn lock', async () => { 
      mockFs({
        '/path/to/yarn.lock': 'yarnLockContent'
      })
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      await cauldronHelper.addYarnLock(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        'Foo',
        '/path/to/yarn.lock')
      const nativeAppVersion = jp.query(fixture, testAndroid1770Path)[0]
      expect(nativeAppVersion.yarnLocks).to.have.property('Foo')
    })
  })

  describe('getYarnLock', () => {
    it('should throw if the given native application descriptor is partial', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      assert(doesThrow(
        cauldronHelper.getYarnLock, 
        NativeApplicationDescriptor.fromString('test:android'),
        'Production'))
    })

    it('should throw if the given native application descriptor is not in Cauldron', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      assert(doesThrow(
        cauldronHelper.getYarnLock, 
        NativeApplicationDescriptor.fromString('test:android:0.0.0'),
        'Production'))
    })

    it('should return undefined if the yarn lock is not found for key', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      const yarnLock = await cauldronHelper.getYarnLock(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        'Foo')
      expect(yarnLock).undefined
    })

    it('should return the yarn lock if found for key', async () => {
      mockFs({
        '/path/to/yarn.lock': 'yarnLockContent'
      })
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      await cauldronHelper.addYarnLock(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        'Foo',
        '/path/to/yarn.lock')
      const yarnLock = await cauldronHelper.getYarnLock(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        'Foo')
      expect(yarnLock.toString()).eql('yarnLockContent')
    })
  })

  describe('getPathToYarnLock', () => {
    it('should throw if the given native application descriptor is partial', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      assert(doesThrow(
        cauldronHelper.getPathToYarnLock, 
        NativeApplicationDescriptor.fromString('test:android'),
        'Production'))
    })

    it('should throw if the given native application descriptor is not in Cauldron', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      assert(doesThrow(
        cauldronHelper.getPathToYarnLock, 
        NativeApplicationDescriptor.fromString('test:android:0.0.0'),
        'Production'))
    })

    it('should return undefined if there is no yarn lock for the key', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      const result = await cauldronHelper.getPathToYarnLock(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
       'Foo')
      expect(result).undefined
    })

    it('should return the path to the yarn lock', async () => {
      mockFs({
        '/path/to/yarn.lock': 'yarnLockContent'
      })
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      await cauldronHelper.addYarnLock(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        'Foo',
        '/path/to/yarn.lock')
      const result = await cauldronHelper.getPathToYarnLock(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
       'Foo')
      expect(result).to.be.a('string')
    })
  })

  describe('removeYarnLock', () => {
    it('should throw if the given native application descriptor is partial', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      assert(doesThrow(
        cauldronHelper.removeYarnLock, 
        NativeApplicationDescriptor.fromString('test:android'),
        'Production'))
    })

    it('should throw if the given native application descriptor is not in Cauldron', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      assert(doesThrow(
        cauldronHelper.removeYarnLock, 
        NativeApplicationDescriptor.fromString('test:android:0.0.0'),
        'Production'))
    })

    it('should remove the yarn lock', async () => {
      mockFs({
        '/path/to/yarn.lock': 'yarnLockContent'
      })
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      await cauldronHelper.addYarnLock(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        'Foo',
        '/path/to/yarn.lock')
      await cauldronHelper.removeYarnLock(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        'Foo',
        '/path/to/yarn.lock')
      const nativeAppVersion = jp.query(fixture, testAndroid1770Path)[0]
      expect(nativeAppVersion.yarnLocks).to.not.have.property('Foo')
    })
  })

  describe('updateYarnLock', () => {
    it('should throw if the given native application descriptor is partial', async () => {
      mockFs({
        '/path/to/yarn.lock': 'yarnLockContent'
      })
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      assert(doesThrow(
        cauldronHelper.updateYarnLock, 
        NativeApplicationDescriptor.fromString('test:android'),
        'Production',
        '/path/to/yarn.lock'))
    })

    it('should throw if the given native application descriptor is not in Cauldron', async () => {
      mockFs({
        '/path/to/yarn.lock': 'yarnLockContent'
      })
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      assert(doesThrow(
        cauldronHelper.updateYarnLock, 
        NativeApplicationDescriptor.fromString('test:android:0.0.0'),
        'Production',
        '/path/to/yarn.lock'))
    })

    it('should update the yarn lock', async () => {
      mockFs({
        '/path/to/yarn.lock': 'yarnLockContent',
        '/path/to/new/yarn.lock': 'updatedYarnLockContent'
      })
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      await cauldronHelper.addYarnLock(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        'Foo',
        '/path/to/yarn.lock')
      await cauldronHelper.updateYarnLock(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        'Foo',
        '/path/to/new/yarn.lock')
      const yarnLock = await cauldronHelper.getYarnLock(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        'Foo')
      expect(yarnLock.toString()).eql('updatedYarnLockContent')
    })

    it('should return true if yarn lock was updated', async () => {
      mockFs({
        '/path/to/yarn.lock': 'yarnLockContent',
        '/path/to/new/yarn.lock': 'updatedYarnLockContent'
      })
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      await cauldronHelper.addYarnLock(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        'Foo',
        '/path/to/yarn.lock')
      const result = await cauldronHelper.updateYarnLock(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        'Foo',
        '/path/to/new/yarn.lock')
      expect(result).true
    })

    it('should return false if yarn lock was not updated', async () => {
      mockFs({
        '/path/to/yarn.lock': 'yarnLockContent',
        '/path/to/new/yarn.lock': 'updatedYarnLockContent'
      })
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      const result = await cauldronHelper.updateYarnLock(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        'Foo',
        '/path/to/new/yarn.lock')
      expect(result).false
    })
  })

  describe('setYarnLocks', () => {
    it('should throw if the given native application descriptor is partial', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      assert(doesThrow(
        cauldronHelper.setYarnLocks, 
        NativeApplicationDescriptor.fromString('test:android'), { 
        'Foo': '2110ae042d2bf337973c7b60615ba19fe7fb120c', 
        'Bar': '91bf4eff61586d71fe5d52e31a2cfabcbb31e33e'
      }))
    })

    it('should throw if the given native application descriptor is not in Cauldron', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      assert(doesThrow(
        cauldronHelper.setYarnLocks, 
        NativeApplicationDescriptor.fromString('test:android:0.0.0'), { 
        'Foo': '2110ae042d2bf337973c7b60615ba19fe7fb120c', 
        'Bar': '91bf4eff61586d71fe5d52e31a2cfabcbb31e33e'
      }))
    })

    it('should set the yarn locks', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      await cauldronHelper.setYarnLocks(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'), { 
        'Foo': '2110ae042d2bf337973c7b60615ba19fe7fb120c', 
        'Bar': '91bf4eff61586d71fe5d52e31a2cfabcbb31e33e'
      })
      const nativeAppVersion = jp.query(fixture, testAndroid1770Path)[0]
      expect(nativeAppVersion.yarnLocks).to.have.property('Foo').eql('2110ae042d2bf337973c7b60615ba19fe7fb120c')
      expect(nativeAppVersion.yarnLocks).to.have.property('Bar').eql('91bf4eff61586d71fe5d52e31a2cfabcbb31e33e')
    })
  })

  describe('addOrUpdateYarnLock', () => {
    it('should throw if the given native application descriptor is partial', async () => {
      mockFs({
        '/path/to/yarn.lock': 'yarnLockContent'
      })
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      assert(doesThrow(
        cauldronHelper.addOrUpdateYarnLock, 
        NativeApplicationDescriptor.fromString('test:android'), 
        'Production',
        '/path/to/yarn.lock'))
    })

    it('should throw if the given native application descriptor is not in Cauldron', async () => {
      mockFs({
        '/path/to/yarn.lock': 'yarnLockContent'
      })
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      assert(doesThrow(
        cauldronHelper.addOrUpdateYarnLock, 
        NativeApplicationDescriptor.fromString('test:android:0.0.0'), 
        'Production',
        '/path/to/yarn.lock'))
    })

    it('should add the yarn lock if it does not exist yet', async () => {
      mockFs({
        '/path/to/yarn.lock': 'yarnLockContent'
      })
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      await cauldronHelper.addYarnLock(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        'Foo',
        '/path/to/yarn.lock')
      const nativeAppVersion = jp.query(fixture, testAndroid1770Path)[0]
      expect(nativeAppVersion.yarnLocks).to.have.property('Foo')
    })

    it('should update the yarn lock if exists', async () => {
      mockFs({
        '/path/to/yarn.lock': 'yarnLockContent'
      })
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      await cauldronHelper.addYarnLock(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        'Production',
        '/path/to/yarn.lock')
      const nativeAppVersion = jp.query(fixture, testAndroid1770Path)[0]
      expect(nativeAppVersion.yarnLocks).to.have.property('Production').not.eql('91bf4eff61586d71fe5d52e31a2cfabcbb31e33e')
    })
  })

  describe('getYarnLockId', () => {
    it('should throw if the given native application descriptor is partial', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      assert(doesThrow(
        cauldronHelper.getYarnLockId, 
        NativeApplicationDescriptor.fromString('test:android'), 
        'Production'))
    })

    it('should throw if the given native application descriptor is not in Cauldron', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      assert(doesThrow(
        cauldronHelper.getYarnLockId, 
        NativeApplicationDescriptor.fromString('test:android:0.0.0'), 
        'Production'))
    })

    it('should return if the yarn lock id', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      const result = await cauldronHelper.getYarnLockId( 
        NativeApplicationDescriptor.fromString('test:android:17.7.0'), 
        'Production')
      expect(result).eql('91bf4eff61586d71fe5d52e31a2cfabcbb31e33e')
    })
  })

  describe('setYarnLockId', () => {
    it('should throw if the given native application descriptor is partial', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      assert(doesThrow(
        cauldronHelper.setYarnLockId, 
        NativeApplicationDescriptor.fromString('test:android'), 
        'Foo',
        '1111111111111171fe5d52e31a2cfabcbb31e33e'))
    })

    it('should throw if the given native application descriptor is not in Cauldron', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      assert(doesThrow(
        cauldronHelper.setYarnLockId, 
        NativeApplicationDescriptor.fromString('test:android:0.0.0'), 
        'Foo',
        '1111111111111171fe5d52e31a2cfabcbb31e33e'))
    })

    it('should set the yarn lock id', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      await cauldronHelper.setYarnLockId(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'), 
        'Foo',
        '1111111111111171fe5d52e31a2cfabcbb31e33e')
      const nativeAppVersion = jp.query(fixture, testAndroid1770Path)[0]
      expect(nativeAppVersion.yarnLocks).to.have.property('Foo').eql('1111111111111171fe5d52e31a2cfabcbb31e33e')
    })
  })

  describe('updateYarnLockId', () => {
    it('should throw if the given native application descriptor is partial', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      assert(doesThrow(
        cauldronHelper.updateYarnLockId, 
        NativeApplicationDescriptor.fromString('test:android'), 
        'Production',
        '1111111111111171fe5d52e31a2cfabcbb31e33e'))
    })

    it('should throw if the given native application descriptor is not in Cauldron', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      assert(doesThrow(
        cauldronHelper.updateYarnLockId, 
        NativeApplicationDescriptor.fromString('test:android:0.0.0'), 
        'Production',
        '1111111111111171fe5d52e31a2cfabcbb31e33e'))
    })

    it('should upddate the yarn lock id', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      await cauldronHelper.updateYarnLockId(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'), 
        'Production',
        '1111111111111171fe5d52e31a2cfabcbb31e33e')
      const nativeAppVersion = jp.query(fixture, testAndroid1770Path)[0]
      expect(nativeAppVersion.yarnLocks).to.have.property('Production').eql('1111111111111171fe5d52e31a2cfabcbb31e33e')
    })
  })

  describe ('getNativeDependency', () => {
    it('should throw if the given native application descriptor is partial', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      assert(doesThrow(
        cauldronHelper.getNativeDependency, 
        NativeApplicationDescriptor.fromString('test:android'), 
        'react-native-electrode-bridge'))
    })

    it('should throw if the given native application descriptor is not in Cauldron', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      assert(doesThrow(
        cauldronHelper.getNativeDependency, 
        NativeApplicationDescriptor.fromString('test:android:0.0.0'), 
        'react-native-electrode-bridge'))
    })

    it('should return undefined if the dependency was not found [1]', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      const result = await cauldronHelper.getNativeDependency(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'), 
        'foo')
      expect(result).undefined
    })

    it('should return undefined if the dependency was not found [1]', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      const result = await cauldronHelper.getNativeDependency(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'), 
        'react-native-electrode-bridge@0.0.1')
      expect(result).undefined
    })

    it('should return the dependency [1]', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      const result = await cauldronHelper.getNativeDependency(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'), 
        'react-native-electrode-bridge')
      expect(result).not.undefined
      expect(result.name).eql('react-native-electrode-bridge')
    })

    it('should return the dependency [2]', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      const result = await cauldronHelper.getNativeDependency(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'), 
        'react-native-electrode-bridge@1.4.9')
      expect(result).not.undefined
      expect(result.name).eql('react-native-electrode-bridge')
    })
  })

  describe('updateNativeAppDependency', () => {
    it('should throw if the given native application descriptor is partial', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      assert(doesThrow(
        cauldronHelper.updateNativeAppDependency, 
        NativeApplicationDescriptor.fromString('test:android'),
        Dependency.fromString('react-native-electrode-bridge'),
        '1.5.0'))
    })

    it('should throw if the given native application descriptor is not in Cauldron', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      assert(doesThrow(
        cauldronHelper.updateNativeAppDependency, 
        NativeApplicationDescriptor.fromString('test:android:0.0.0'),
        Dependency.fromString('react-native-electrode-bridge'),
        '1.5.0'))
    })

    it('should throw if the given native application version is released', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      assert(doesThrow(
        cauldronHelper.updateNativeAppDependency, 
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        Dependency.fromString('react-native-electrode-bridge'),
        '1.5.0'))
    })

    it('should update the native dependency version', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      await cauldronHelper.updateNativeAppDependency(
        NativeApplicationDescriptor.fromString('test:android:17.8.0'),
        Dependency.fromString('react-native-electrode-bridge'),
        '1.5.0')
      const nativeAppVersion = jp.query(fixture, testAndroid1780Path)[0]
      expect(nativeAppVersion.nativeDeps).includes('react-native-electrode-bridge@1.5.0')
      expect(nativeAppVersion.nativeDeps).not.includes('react-native-electrode-bridge@1.4.9')
    })
  })

  describe('getAllNativeApps', () => {
    it('should return all native applications', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture) 
      const result = await cauldronHelper.getAllNativeApps()
      expect(result).to.be.an('array').of.length(1)
    })
  })

  describe('getContainerMiniApp', () => {
    it('should throw if the given native application descriptor is partial', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      assert(doesThrow(
        cauldronHelper.getContainerMiniApp, 
        NativeApplicationDescriptor.fromString('test:android'),
        'react-native-bar'))
    })

    it('should throw if the given native application descriptor is not in Cauldron', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      assert(doesThrow(
        cauldronHelper.getContainerMiniApp, 
        NativeApplicationDescriptor.fromString('test:android:0.0.0'),
        'react-native-bar'))
    })

    it('should return undefined if the MiniApp was not found [1]', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      const result = await cauldronHelper.getContainerMiniApp(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        'foo@1.0.0')
      expect(result).undefined
    })

    it('should return undefined if the MiniApp was not found [2]', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      const result = await cauldronHelper.getContainerMiniApp(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        'react-native-bar@0.0.1')
      expect(result).undefined
    })

    it('should return the MiniApp [1]', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      const result = await cauldronHelper.getContainerMiniApp(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        'react-native-bar')
      expect(result).not.undefined
    })

    it('should return the MiniApp [2]', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      const result = await cauldronHelper.getContainerMiniApp(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        'react-native-bar@2.0.0')
      expect(result).not.undefined
    })
  })

  describe('getCodePushMiniApps', () => {
    it('should throw if the given native application descriptor is partial', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      assert(doesThrow(
        cauldronHelper.getCodePushMiniApps, 
        NativeApplicationDescriptor.fromString('test:android'),
        'Production'))
    })

    it('should throw if the given native application descriptor is not in Cauldron', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      assert(doesThrow(
        cauldronHelper.getCodePushMiniApps, 
        NativeApplicationDescriptor.fromString('test:android:0.0.0'),
        'Production'))
    })

    it('should return undefined if no MiniApps were CodePushed', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      const result = await cauldronHelper.getCodePushMiniApps(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        'Foo')
      expect(result).undefined
    })

    it('should return the CodePushed MiniApps', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      const result = await cauldronHelper.getCodePushMiniApps(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        'Production')
      expect(result).to.be.an('array').of.length(2)
    })
  })

  describe('getContainerMiniApps', () => {
    it('should throw if the given native application descriptor is partial', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      assert(doesThrow(
        cauldronHelper.getContainerMiniApps, 
        NativeApplicationDescriptor.fromString('test:android')))
    })

    it('should throw if the given native application descriptor is not in Cauldron', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      assert(doesThrow(
        cauldronHelper.getContainerMiniApps, 
        NativeApplicationDescriptor.fromString('test:android:0.0.0')))
    })

    it('should return the container MiniApps', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      const result = await cauldronHelper.getContainerMiniApps(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'))
      expect(result).to.be.an('array').of.length(2)
    })
  })

  describe('addCodePushEntry', () => {
    it('should throw if the given native application descriptor is partial', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      assert(doesThrow(
        cauldronHelper.addCodePushEntry, 
        NativeApplicationDescriptor.fromString('test:android'),
        codePushMetadataFixtureOne,
        miniAppsFixtureOne))
    })

    it('should throw if the given native application descriptor is not in Cauldron', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      assert(doesThrow(
        cauldronHelper.addCodePushEntry, 
        NativeApplicationDescriptor.fromString('test:android:0.0.0'),
        codePushMetadataFixtureOne,
        miniAppsFixtureOne))
    })

    it('should properly apply the entriesLimit config [limit of 2 entries]', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      fixture.config.codePush = { entriesLimit: 2 }
      const cauldronHelper = createCauldronHelper(fixture)
      await cauldronHelper.addCodePushEntry(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        codePushMetadataFixtureOne,
        miniAppsFixtureOne)
        const result = jp.query(fixture, `${testAndroid1770Path}.codePush.Production`)[0]
        expect(result).to.be.an('array').of.length(2)
        expect(result[1].metadata).eql(codePushMetadataFixtureOne)
    })

    it('should properly apply the entriesLimit config [limit of 0 entries = unlimited entries]', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      fixture.config.codePush = { entriesLimit: 0 }
      const cauldronHelper = createCauldronHelper(fixture)
      await cauldronHelper.addCodePushEntry(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        codePushMetadataFixtureOne,
        miniAppsFixtureOne)
        const result = jp.query(fixture, `${testAndroid1770Path}.codePush.Production`)[0]
        expect(result).to.be.an('array').of.length(3)
        expect(result[2].metadata).eql(codePushMetadataFixtureOne)
    })

    it('should work if there is no entriesLimit config [unlimited entries]', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      await cauldronHelper.addCodePushEntry(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        codePushMetadataFixtureOne,
        miniAppsFixtureOne)
        const result = jp.query(fixture, `${testAndroid1770Path}.codePush.Production`)[0]
        expect(result).to.be.an('array').of.length(3)
        expect(result[2].metadata).eql(codePushMetadataFixtureOne)
    })

    it('should work if there is no entriesLimit config [unlimited entries] with no current CodePush entry in Cauldron', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      await cauldronHelper.addCodePushEntry(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        codePushMetadataFixtureTwo,
        miniAppsFixtureOne)
        const result = jp.query(fixture, `${testAndroid1770Path}.codePush.Staging`)[0]
        expect(result).to.be.an('array').of.length(1)
        expect(result[0].metadata).eql(codePushMetadataFixtureTwo)
    })

    it('should work if there is a entriesLimit config [limit of 2 entries] with no current CodePush entry in Cauldron', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      fixture.config.codePush = { entriesLimit: 2 }
      const cauldronHelper = createCauldronHelper(fixture)
      await cauldronHelper.addCodePushEntry(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        codePushMetadataFixtureTwo,
        miniAppsFixtureOne)
        const result = jp.query(fixture, `${testAndroid1770Path}.codePush.Staging`)[0]
        expect(result).to.be.an('array').of.length(1)
        expect(result[0].metadata).eql(codePushMetadataFixtureTwo)
    })
  })

  describe('updateCodePushEntry', () => {
    it('should throw if the given native application descriptor is partial', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      assert(doesThrow(
        cauldronHelper.updateCodePushEntry, 
        NativeApplicationDescriptor.fromString('test:android'),
        'Production',
        'v17', {
          isDisabled: true
        }))
    })

    it('should throw if the given native application descriptor is not in Cauldron', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      assert(doesThrow(
        cauldronHelper.updateCodePushEntry, 
        NativeApplicationDescriptor.fromString('test:android:0.0.0'),
        'Production',
        'v17',{
          isDisabled: true
        }))
    })

    it('should update the code push entry isDisabled property', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      await cauldronHelper.updateCodePushEntry(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        'Production',
        'v17', {
          isDisabled: true
        })
        const codePushEntries = jp.query(fixture, `${testAndroid1770Path}.codePush.Production`)[0]
        expect(codePushEntries).to.be.an('array').of.length(2)
        const updatedEntry = jp.query(codePushEntries,`$[?(@.metadata.label=="v17")]`)[0]
        console.log(`updatedEntry is ${JSON.stringify(updatedEntry)}`)

        expect(updatedEntry.metadata).to.have.property('isDisabled').eql(true)
    })

    it('should update the code push entry isMandatory property', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      await cauldronHelper.updateCodePushEntry(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        'Production',
        'v17', {
          isMandatory: true
        })
        const codePushEntries = jp.query(fixture, `${testAndroid1770Path}.codePush.Production`)[0]
        expect(codePushEntries).to.be.an('array').of.length(2)
        const updatedEntry = jp.query(codePushEntries,`$[?(@.metadata.label=="v17")]`)[0]
        console.log(`updatedEntry is ${JSON.stringify(updatedEntry)}`)

        expect(updatedEntry.metadata).to.have.property('isMandatory').eql(true)
    })

    it('should update the code push entry rollout property', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      await cauldronHelper.updateCodePushEntry(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        'Production',
        'v17', {
          rollout: 10
        })
        const codePushEntries = jp.query(fixture, `${testAndroid1770Path}.codePush.Production`)[0]
        expect(codePushEntries).to.be.an('array').of.length(2)
        const updatedEntry = jp.query(codePushEntries,`$[?(@.metadata.label=="v17")]`)[0]
        console.log(`updatedEntry is ${JSON.stringify(updatedEntry)}`)

        expect(updatedEntry.metadata).to.have.property('rollout').eql(10)
    })
  })

  describe('getContainerGeneratorConfig', () => {
    it('should return the container generator config', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      const result = await cauldronHelper.getContainerGeneratorConfig(
        NativeApplicationDescriptor.fromString('test:android'))
      expect(result).not.undefined
    })

    it('should return undefined if it does not find the container generator config', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      const result = await cauldronHelper.getContainerGeneratorConfig(
        NativeApplicationDescriptor.fromString('toto:android'))
      expect(result).undefined
    })
  })

  describe('getManifestConfig', () => {
    it('should return the manifest config', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      const result = await cauldronHelper.getManifestConfig(
        NativeApplicationDescriptor.fromString('test:android'))
      expect(result).not.undefined
    })
  })

  describe('getBinaryStoreConfig', () => {
    it('should return the binary store config', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      const result = await cauldronHelper.getBinaryStoreConfig(
        NativeApplicationDescriptor.fromString('test:android'))
      expect(result).not.undefined
    })
  })

  describe('getCodePushConfig', () => {
    it('should return the code push config', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      const result = await cauldronHelper.getCodePushConfig(
        NativeApplicationDescriptor.fromString('test:android'))
      expect(result).not.undefined
    })
  })

  describe('getConfig', () => {
    it('should return the native application version config', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      const result = await cauldronHelper.getConfig(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'))
      expect(result).not.undefined
      expect(result).to.have.property('test')
    })

    it('should return the native application platform config', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      const result = await cauldronHelper.getConfig(
        NativeApplicationDescriptor.fromString('test:android'))
      expect(result).not.undefined
      expect(result).to.have.property('containerGenerator')
    })
  })

  describe('getConfigForKey', () => {
    it('should return the native application version config key', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      const result = await cauldronHelper.getConfigForKey(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        'test')
      expect(result).not.undefined
    })

    it('should return the native application platform config key', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      const result = await cauldronHelper.getConfigForKey(
        NativeApplicationDescriptor.fromString('test:android'),
        'containerGenerator')
      expect(result).not.undefined
    })
  })

  describe('updateNativeAppIsReleased', () => {
    it('should throw if the given native application descriptor is partial', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      assert(doesThrow(
        cauldronHelper.updateNativeAppIsReleased, 
        NativeApplicationDescriptor.fromString('test:android'),
        false))
    })

    it('should throw if the given native application descriptor is not in Cauldron', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      assert(doesThrow(
        cauldronHelper.updateNativeAppIsReleased, 
        NativeApplicationDescriptor.fromString('test:android:0.0.0'),
        false))
    })

    it('should update the native application version release status', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      await cauldronHelper.updateNativeAppIsReleased( 
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        false)
      const nativeApplicationVersion = jp.query(fixture, testAndroid1770Path)[0]
      expect(nativeApplicationVersion.isReleased).false
    })
  })

  describe('updateContainerVersion', () => {
    it('should throw if the given native application descriptor is partial', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      assert(doesThrow(
        cauldronHelper.updateContainerVersion,
        NativeApplicationDescriptor.fromString('test:android'),
        '999.0.0'))
    })

    it('should throw if the given native application descriptor is not in Cauldron', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      assert(doesThrow(
        cauldronHelper.updateContainerVersion,
        NativeApplicationDescriptor.fromString('test:android:0.0.0'),
        '999.0.0'))
    })

    it('should update the container version', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      await cauldronHelper.updateContainerVersion( 
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        '999.0.0')
      const nativeApplicationVersion = jp.query(fixture, testAndroid1770Path)[0]
      expect(nativeApplicationVersion.containerVersion).eql('999.0.0')
    })
  })

  describe('getContainerVersion', () => {
    it('should throw if the given native application descriptor is partial', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      assert(doesThrow(
        cauldronHelper.getContainerVersion,
        NativeApplicationDescriptor.fromString('test:android')))
    })

    it('should throw if the given native application descriptor is not in Cauldron', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      assert(doesThrow(
        cauldronHelper.getContainerVersion,
        NativeApplicationDescriptor.fromString('test:android:0.0.0')))
    })

    it('should return the container version', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      const result = await cauldronHelper.getContainerVersion(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'))
      expect(result).equal('1.16.44')
    })
  })

  describe('getTopLevelContainerVersion', () => {
    it('should return the top level container version', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      const result = await cauldronHelper.getTopLevelContainerVersion(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'))
      expect(result).equal('1.16.44')
    })
  })

  describe('throwIfPartialNapDescriptor', () => {
    it('should throw if provided a partial native application descriptor [1]', () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      expect(() => { cauldronHelper.throwIfPartialNapDescriptor(
        NativeApplicationDescriptor.fromString('test')
      )}).to.throw()
    })

    it('should throw if provided a partial native application descriptor [2]', () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      expect(() => { cauldronHelper.throwIfPartialNapDescriptor(
        NativeApplicationDescriptor.fromString('test:android')
      )}).to.throw()
    })

    it('should not throw if provided a complete native application descriptor', () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      expect(() => { cauldronHelper.throwIfPartialNapDescriptor(
        NativeApplicationDescriptor.fromString('test:android:17.70')
      )}).to.not.throw()
    })
  })

  describe('throwIfNativeApplicationNotInCauldron', () => {
    it('should throw if the native application descriptor is not in cauldron', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      assert(doesThrow(
        cauldronHelper.throwIfNativeApplicationNotInCauldron,
        NativeApplicationDescriptor.fromString('test:android:0.0.0')))
    })

    it('should not throw if the native application descriptor is in cauldron', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      assert(doesNotThrow(
        cauldronHelper.throwIfNativeApplicationNotInCauldron,
        NativeApplicationDescriptor.fromString('test:android:17.7.0')))
    })
  })

  describe('throwIfNativeAppVersionIsReleased', () => {
    it('should throw if the native application version is release', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      assert(doesThrow(
        cauldronHelper.throwIfNativeAppVersionIsReleased,
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        'released'))
    })

    it('should not throw if the native application version is not released', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper(fixture)
      assert(doesNotThrow(
        cauldronHelper.throwIfNativeAppVersionIsReleased,
        NativeApplicationDescriptor.fromString('test:android:17.8.0'),
        'nonreleased'))
    })
  })
})