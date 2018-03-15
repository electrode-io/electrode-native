// @flow

import {
  assert,
  expect
} from 'chai'
import {
  doesThrow
} from 'ern-util-dev'
import sinon from 'sinon'
import path from 'path'
import fs from 'fs'
import {
  generateMiniAppsComposite,
  getMiniAppsDeltas,
  getPackageJsonDependenciesUsingMiniAppDeltas,
  runYarnUsingMiniAppDeltas
} from '../src/utils'
import {
  beforeTest,
  afterTest
} from 'ern-util-dev'
import * as ernUtil from 'ern-core'
const {
  PackagePath,
  YarnCli,
  shell
} = ernUtil
const sandbox = sinon.createSandbox()

// Spies
let yarnCliStub

let tmpOutDir
const currentDir = process.cwd()
const pathToFixtures = path.join(currentDir, 'test', 'fixtures')
const pathToSampleYarnLock = path.join(pathToFixtures, 'sample.yarn.lock')
const sampleYarnLock = fs.readFileSync(pathToSampleYarnLock, 'utf8')

describe('ern-container-gen utils.js', () => {
  // Before each test
  beforeEach(() => {
    beforeTest()

    yarnCliStub = sandbox.stub(YarnCli.prototype)
    sandbox.stub(ernUtil, 'spin').callsFake(async (msg, prom) => { await prom })

    // Go back to initial dir (otherwise we might start execution from a temporary
    // created directory that got removed and it makes shelljs go crazy)
    process.chdir(currentDir)

    // Create temporary directory to use as target output directory of some
    // functions under test
    tmpOutDir = ernUtil.createTmpDir()
  })

  // After each test
  afterEach(() => {
    // Remove the temporary output directory created for the test
    shell.rm('-rf', tmpOutDir)
    sandbox.restore()
    afterTest()
  })

  // ==========================================================
  // getMiniAppsDeltas
  // ==========================================================
  describe('getMiniAppsDeltas', () => {
    it('should compute new deltas', () => {
      const miniApps = [
        PackagePath.fromString('MiniAppFour@1.0.0'),
        PackagePath.fromString('MiniAppFive@1.0.0')
      ]
      const result = getMiniAppsDeltas(miniApps, sampleYarnLock)
      expect(result).to.have.property('new').that.is.a('array').lengthOf(2)
    })

    it('should compute same deltas', () => {
      const miniApps = [
        PackagePath.fromString('MiniAppOne@6.0.0'),
        PackagePath.fromString('MiniAppTwo@3.0.0')
      ]
      const result = getMiniAppsDeltas(miniApps, sampleYarnLock)
      expect(result).to.have.property('same').that.is.a('array').lengthOf(2)
    })

    it('should compute upgraded deltas', () => {
      const miniApps = [
        PackagePath.fromString('MiniAppOne@7.0.0'),
        PackagePath.fromString('MiniAppTwo@4.0.0')
      ]
      const result = getMiniAppsDeltas(miniApps, sampleYarnLock)
      expect(result).to.have.property('upgraded').that.is.a('array').lengthOf(2)
    })

    it('should compute deltas', () => {
      const miniApps = [
        PackagePath.fromString('MiniAppOne@1.0.0'),
        PackagePath.fromString('MiniAppTwo@3.0.0'),
        PackagePath.fromString('MiniAppFour@1.0.0')
      ]
      const result = getMiniAppsDeltas(miniApps, sampleYarnLock)
      expect(result).to.have.property('new').that.is.a('array').lengthOf(1)
      expect(result).to.have.property('same').that.is.a('array').lengthOf(1)
      expect(result).to.have.property('upgraded').that.is.a('array').lengthOf(1)
    })
  })

  // ==========================================================
  // runYarnUsingMiniAppDeltas
  // ==========================================================
  describe('runYarnUsingMiniAppDeltas', () => {
    it('should yarn add new MiniApps', async () => {
      const miniAppsDeltas = {
        new: [ { name: 'MiniAppFour', version: '7.0.0' }, { name: 'MiniAppFive', version: '4.0.0' } ]
      }
      await runYarnUsingMiniAppDeltas(miniAppsDeltas)
      assert(yarnCliStub.add.calledTwice)
    })

    it('should yarn upgrade upgraded MiniApps', async () => {
      const miniAppsDeltas = {
        upgraded: [ { name: 'MiniAppOne', version: '7.0.0' }, { name: 'MiniAppTwo', version: '4.0.0' } ]
      }
      await runYarnUsingMiniAppDeltas(miniAppsDeltas)
      assert(yarnCliStub.upgrade.calledTwice)
    })

    it('should not yarn upgrade nor yarn add same MiniApps versions', async () => {
      const miniAppsDeltas = {
        same: [ { name: 'MiniAppOne', version: '6.0.0' }, { name: 'MiniAppTwo', version: '3.0.0' } ]
      }
      await runYarnUsingMiniAppDeltas(miniAppsDeltas)
      assert(yarnCliStub.upgrade.notCalled)
      assert(yarnCliStub.add.notCalled)
    })

    it('should work correctly with mixed deltas', async () => {
      const miniAppsDeltas = {
        upgraded: [ { nabasePathme: 'MiniAppOne', version: '7.0.0' }, { basePath: 'MiniAppTwo', version: '4.0.0' } ],
        same: [ { basePath: 'MiniAppOne', version: '6.0.0' }, { basePath: 'MiniAppTwo', version: '3.0.0' } ],
        new: [ { basePath: 'MiniAppFour', version: '7.0.0' } ]
      }
      await runYarnUsingMiniAppDeltas(miniAppsDeltas)
      assert(yarnCliStub.upgrade.calledTwice)
      assert(yarnCliStub.add.calledOnce)
    })
  })

  // ==========================================================
  // getPackageJsonDependenciesBasedOnMiniAppDeltas
  // ==========================================================
  describe('getPackageJsonDependenciesBasedOnMiniAppDeltas', () => {
    it('should inject MiniApps that have same version as previous', () => {
      const miniAppsDeltas = {
        same: [ { basePath: 'MiniAppOne', version: '6.0.0' }, { basePath: 'MiniAppTwo', version: '3.0.0' } ]
      }
      const result = getPackageJsonDependenciesUsingMiniAppDeltas(miniAppsDeltas, sampleYarnLock)
      expect(result).to.have.property('MiniAppOne', '6.0.0')
      expect(result).to.have.property('MiniAppTwo', '3.0.0')
    })

    it('should inject MiniApps that have upgraded versions', () => {
      const miniAppsDeltas = {
        upgraded: [ { basePath: 'MiniAppOne', version: '7.0.0' }, { basePath: 'MiniAppTwo', version: '4.0.0' } ]
      }
      const result = getPackageJsonDependenciesUsingMiniAppDeltas(miniAppsDeltas, sampleYarnLock)
      expect(result).to.have.property('MiniAppOne', '6.0.0')
      expect(result).to.have.property('MiniAppTwo', '3.0.0')
    })

    it('should not inject MiniApps that are new', () => {
      const miniAppsDeltas = {
        new: [ { basePath: 'MiniAppFour', version: '7.0.0' }, { basePath: 'MiniAppFive', version: '4.0.0' } ]
      }
      const result = getPackageJsonDependenciesUsingMiniAppDeltas(miniAppsDeltas, sampleYarnLock)
      expect(result).empty
    })

    it('should inject proper MiniApps', () => {
      const miniAppsDeltas = {
        new: [ { basePath: 'MiniAppFour', version: '7.0.0' } ],
        upgraded: [ { basePath: 'MiniAppTwo', version: '4.0.0' } ],
        same: [ { basePath: 'MiniAppOne', version: '6.0.0' } ]
      }
      const result = getPackageJsonDependenciesUsingMiniAppDeltas(miniAppsDeltas, sampleYarnLock)
      expect(result).to.have.property('MiniAppOne', '6.0.0')
      expect(result).to.have.property('MiniAppTwo', '3.0.0')
    })
  })

  // ==========================================================
  // generateMiniAppsComposite [with yarn lock]
  // ==========================================================
  describe('generateMiniAppsComposite [with yarn lock]', () => {
    it('should throw an exception if at least one of the MiniApp path is using a file scheme [1]', async () => {
      const miniApps = [PackagePath.fromString('file:/Code/MiniApp')]
      assert(await doesThrow(generateMiniAppsComposite, null, miniApps, tmpOutDir, {pathToYarnLock: 'hello'}), 'No exception was thrown !')
    })

    it('should throw an exception if at least one of the MiniApp path is using a file scheme [2]', async () => {
      const miniApps = [PackagePath.fromString('MiniAppOne@1.0.0'), PackagePath.fromString('file:/Code/MiniApp')]
      assert(await doesThrow(generateMiniAppsComposite, null, miniApps, tmpOutDir, {pathToYarnLock: 'hello'}), 'No exception was thrown !')
    })

    it('should throw an exception if at least one of the MiniApp path is using a git scheme [1]', async () => {
      const miniApps = [PackagePath.fromString('git://github.com:user/MiniAppRepo')]
      assert(await doesThrow(generateMiniAppsComposite, null, miniApps, tmpOutDir, {pathToYarnLock: 'hello'}), 'No exception was thrown !')
    })

    it('should throw an exception if at least one of the MiniApp path is using a git scheme [2]', async () => {
      const miniApps = [PackagePath.fromString('MiniAppOne@1.0.0'), PackagePath.fromString('git://github.com:user/MiniAppRepo')]
      assert(await doesThrow(generateMiniAppsComposite, null, miniApps, tmpOutDir, {pathToYarnLock: 'hello'}), 'No exception was thrown !')
    })

    it('should throw an exception if one of the MiniApp is not using an explicit version [1]', async () => {
      const miniApps = [PackagePath.fromString('MiniAppOne')]
      assert(await doesThrow(generateMiniAppsComposite, null, miniApps, tmpOutDir, {pathToYarnLock: 'hello'}), 'No exception was thrown !')
    })

    it('should throw an exception if one of the MiniApp is not using an explicit version [1]', async () => {
      const miniApps = [PackagePath.fromString('MiniAppOne'), PackagePath.fromString('MiniAppTwo@1.0.0')]
      assert(await doesThrow(generateMiniAppsComposite, null, miniApps, tmpOutDir, {pathToYarnLock: 'hello'}), 'No exception was thrown !')
    })

    it('should throw an exception if path to yarn.lock does not exists', async () => {
      const miniApps = [PackagePath.fromString('MiniAppOne@1.0.0'), PackagePath.fromString('MiniAppTwo@1.0.0')]
      assert(await doesThrow(generateMiniAppsComposite, null, miniApps, tmpOutDir, {pathToYarnLock: path.join(tmpOutDir, 'yarn.lock')}), 'No exception was thrown !')
    })

    it('should call yarn install prior to calling yarn add or yarn upgrade for each MiniApp', async () => {
      // One new, one same, one upgrade
      const miniApps = [
        PackagePath.fromString('MiniAppOne@6.0.0'), // same
        PackagePath.fromString('MiniAppTwo@4.0.0'), // upgraded
        PackagePath.fromString('MiniAppFour@1.0.0') // new
      ]
      await generateMiniAppsComposite(miniApps, tmpOutDir, { pathToYarnLock: pathToSampleYarnLock })
      assert(yarnCliStub.install.calledOnce)
      assert(yarnCliStub.upgrade.calledOnce)
      assert(yarnCliStub.add.calledOnce)
      assert(yarnCliStub.install.calledBefore(yarnCliStub.add))
      assert(yarnCliStub.install.calledBefore(yarnCliStub.upgrade))
    })

    it('should create index.android.js', async () => {
      // One new, one same, one upgrade
      const miniApps = [
        PackagePath.fromString('MiniAppOne@6.0.0')
      ]
      await generateMiniAppsComposite(miniApps, tmpOutDir, { pathToYarnLock: pathToSampleYarnLock })
      assert(fs.existsSync(path.join(tmpOutDir, 'index.android.js')))
    })

    it('should create index.ios.js', async () => {
      // One new, one same, one upgrade
      const miniApps = [
        PackagePath.fromString('MiniAppOne@6.0.0')
      ]
      await generateMiniAppsComposite(miniApps, tmpOutDir, { pathToYarnLock: pathToSampleYarnLock })
      assert(fs.existsSync(path.join(tmpOutDir, 'index.ios.js')))
    })
  })

  // ==========================================================
  // generateMiniAppsComposite [without yarn lock]
  // ==========================================================
  describe('generateMiniAppsComposite [without yarn lock]', () => {
    // For the following tests, because in the case of no yarn lock provided
    // the package.json is created when running first yarn add, and we are using
    // a yarnAdd stub that is not going to run real yarn add, we need to create the
    // expected package.json beforehand
    it('should call yarn add for each MiniApp', async () => {
      const miniApps = [
        PackagePath.fromString('MiniAppOne@6.0.0'), // same
        PackagePath.fromString('MiniAppTwo@4.0.0'), // upgraded
        PackagePath.fromString('MiniAppFour@1.0.0') // new
      ]
      yarnCliStub.init.callsFake(() => { 
        fs.writeFileSync(path.join(tmpOutDir, 'package.json'), 
          JSON.stringify({ dependencies: {} }), 'utf8') 
      })
      await generateMiniAppsComposite(miniApps, tmpOutDir)
      assert(yarnCliStub.add.calledThrice)
    })

    it('should create index.android.js', async () => {
      // One new, one same, one upgrade
      const miniApps = [
        PackagePath.fromString('MiniAppOne@6.0.0')
      ]
      yarnCliStub.init.callsFake(() => { 
        fs.writeFileSync(path.join(tmpOutDir, 'package.json'), 
          JSON.stringify({ dependencies: {} }), 'utf8') 
      })
      await generateMiniAppsComposite(miniApps, tmpOutDir)
      assert(fs.existsSync(path.join(tmpOutDir, 'index.android.js')))
    })

    it('should create index.ios.js', async () => {
      // One new, one same, one upgrade
      const miniApps = [
        PackagePath.fromString('MiniAppOne@6.0.0')
      ]
      yarnCliStub.init.callsFake(() => { 
        fs.writeFileSync(path.join(tmpOutDir, 'package.json'), 
          JSON.stringify({ dependencies: {} }), 'utf8') 
      })
      await generateMiniAppsComposite(miniApps, tmpOutDir)
      assert(fs.existsSync(path.join(tmpOutDir, 'index.android.js')))
    })
  })
})
