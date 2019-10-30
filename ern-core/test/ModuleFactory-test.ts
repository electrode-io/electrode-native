import path from 'path'
import sinon from 'sinon'
import shell from 'shelljs'
import fs from 'fs'
import { assert, expect } from 'chai'
import { ModuleFactory } from '../src/ModuleFactory'
import { doesThrow } from 'ern-util-dev'
import { PackagePath } from '../src/PackagePath'
import { YarnCli } from '../src/YarnCli'

describe('ModuleFactory', () => {
  const PACKAGE_PREFIX = 'package-prefix-'
  const PACKAGE_CACHE_PATH = path.join(__dirname, 'ModuleFactoryCache')
  const FIXTURES_PATH = path.join(__dirname, 'fixtures/ModuleFactory')

  const sandbox = sinon.createSandbox()

  // Spies
  let yarnAddStub
  let yarnUpgradeStub
  let instantiateModuleStub

  const removeTestPackageCacheDirectory = () =>
    shell.rm('-rf', PACKAGE_CACHE_PATH)

  beforeEach(() => {
    yarnAddStub = sandbox.stub(YarnCli.prototype, 'add')
    yarnUpgradeStub = sandbox.stub(YarnCli.prototype, 'upgrade')
    instantiateModuleStub = sandbox.stub(
      ModuleFactory.prototype,
      'instantiateModule'
    )
  })

  afterEach(() => {
    sandbox.restore()
  })

  after(() => {
    removeTestPackageCacheDirectory()
  })

  describe('constructor', () => {
    it('should successfully instantiate a ModuleFactory', () => {
      assert.doesNotThrow(
        () =>
          new ModuleFactory(PACKAGE_CACHE_PATH, {
            packagePrefix: PACKAGE_PREFIX,
          }),
        Error
      )
    })
  })

  describe('getModuleInstance', () => {
    it('should throw if provided PackagePath is a git path', async () => {
      const sut = new ModuleFactory(PACKAGE_CACHE_PATH, {
        packagePrefix: PACKAGE_PREFIX,
      })
      assert(
        await doesThrow(
          sut.getModuleInstance,
          sut,
          PackagePath.fromString('git+ssh://gihub.com/user/repo.git')
        )
      )
    })

    it('should properly instantiate a local package module [without src directory]', async () => {
      const sut = new ModuleFactory(PACKAGE_CACHE_PATH, {
        packagePrefix: PACKAGE_PREFIX,
      })
      const modulePath = path.join(FIXTURES_PATH, 'moduleWithoutSrc')
      await sut.getModuleInstance(PackagePath.fromString(modulePath))
      sandbox.assert.calledWith(instantiateModuleStub, modulePath)
    })

    it('should properly instantiate a local package module [with src directory]', async () => {
      const sut = new ModuleFactory(PACKAGE_CACHE_PATH, {
        packagePrefix: PACKAGE_PREFIX,
      })
      const modulePath = path.join(FIXTURES_PATH, 'moduleWithSrc')
      await sut.getModuleInstance(PackagePath.fromString(modulePath))
      sandbox.assert.calledWith(
        instantiateModuleStub,
        path.join(modulePath, 'src')
      )
    })

    it('should create the cache directory if it does not exist [remote registry package]', async () => {
      // Ensure directory has not already been created
      removeTestPackageCacheDirectory()
      sandbox.stub(YarnCli.prototype, 'init').callsFake(() => {
        fs.writeFileSync('package.json', '{}')
      })
      const sut = new ModuleFactory(PACKAGE_CACHE_PATH, {
        packagePrefix: PACKAGE_PREFIX,
      })
      await sut.getModuleInstance(PackagePath.fromString('foo-package'))
      assert(fs.existsSync(PACKAGE_CACHE_PATH))
    })

    it('should yarn add the package to the cache if not already cached [remote registry package - add prefix]', async () => {
      removeTestPackageCacheDirectory()
      sandbox.stub(YarnCli.prototype, 'init').callsFake(() => {
        fs.writeFileSync('package.json', '{}')
      })
      const sut = new ModuleFactory(PACKAGE_CACHE_PATH, {
        packagePrefix: PACKAGE_PREFIX,
      })
      await sut.getModuleInstance(PackagePath.fromString('foo-package'))
      sandbox.assert.called(yarnAddStub)
      expect(yarnAddStub.args[0].toString()).eql('package-prefix-foo-package')
    })

    it('should yarn add the package to the cache if not already cached [remote registry package - add prefix - with version]', async () => {
      removeTestPackageCacheDirectory()
      sandbox.stub(YarnCli.prototype, 'init').callsFake(() => {
        fs.writeFileSync('package.json', '{}')
      })
      const sut = new ModuleFactory(PACKAGE_CACHE_PATH, {
        packagePrefix: PACKAGE_PREFIX,
      })
      await sut.getModuleInstance(PackagePath.fromString('foo-package@^1.0.0'))
      sandbox.assert.called(yarnAddStub)
      expect(yarnAddStub.args[0].toString()).eql(
        'package-prefix-foo-package@^1.0.0'
      )
    })

    it('should yarn add the package to the cache if not already cached [remote registry package - do not add prefix]', async () => {
      removeTestPackageCacheDirectory()
      sandbox.stub(YarnCli.prototype, 'init').callsFake(() => {
        fs.writeFileSync('package.json', '{}')
      })
      const sut = new ModuleFactory(PACKAGE_CACHE_PATH, {
        packagePrefix: PACKAGE_PREFIX,
      })
      await sut.getModuleInstance(
        PackagePath.fromString('package-prefix-foo-package')
      )
      sandbox.assert.called(yarnAddStub)
      expect(yarnAddStub.args[0].toString()).eql('package-prefix-foo-package')
    })

    it('should yarn upgrade the package in the cache if already cached [remote registry package - with version]', async () => {
      removeTestPackageCacheDirectory()
      sandbox.stub(YarnCli.prototype, 'init').callsFake(() => {
        fs.writeFileSync(
          'package.json',
          '{ "dependencies": { "package-prefix-foo-package" : "1.0.0" } }'
        )
      })
      const sut = new ModuleFactory(PACKAGE_CACHE_PATH, {
        packagePrefix: PACKAGE_PREFIX,
      })
      await sut.getModuleInstance(
        PackagePath.fromString('package-prefix-foo-package@^1.0.0')
      )
      sandbox.assert.called(yarnUpgradeStub)
      expect(yarnUpgradeStub.args[0].toString()).eql(
        'package-prefix-foo-package@^1.0.0'
      )
    })

    it('should properly instantiate a remote registry package module from cache', async () => {
      removeTestPackageCacheDirectory()
      sandbox.stub(YarnCli.prototype, 'init').callsFake(() => {
        fs.writeFileSync('package.json', '{}')
      })
      const sut = new ModuleFactory(PACKAGE_CACHE_PATH, {
        packagePrefix: PACKAGE_PREFIX,
      })
      await sut.getModuleInstance(
        PackagePath.fromString('package-prefix-foo-package')
      )
      const localPathToModuleInCache = path.join(
        PACKAGE_CACHE_PATH,
        'node_modules/package-prefix-foo-package'
      )
      sandbox.assert.calledWith(instantiateModuleStub, localPathToModuleInCache)
    })
  })
})
