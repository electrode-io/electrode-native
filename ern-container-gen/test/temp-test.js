import {
  assert,
  expect
} from 'chai'
import sinon from 'sinon'
import tmp from 'tmp'
import path from 'path'
import fs from 'fs'
import {
  generateMiniAppsComposite,
  getMiniAppsDeltas,
  getPackageJsonDependenciesUsingMiniAppDeltas,
  runYarnUsingMiniAppDeltas
} from '../src/utils'
import * as ernUtil from 'ern-util'
const {
  Dependency,
  DependencyPath,
  YarnCli,
  shell
} = ernUtil

// Spies
const yarnAddSpy = sinon.stub(YarnCli.prototype, 'add').callsFake(() => {})
const yarnUpgradeSpy = sinon.stub(YarnCli.prototype, 'upgrade').callsFake(() => {})
const yarnInstallSpy = sinon.stub(YarnCli.prototype, 'install').callsFake(() => {})
//const yarnAddSpy = sinon.stub(ernUtil.yarn, 'yarnAdd').callsFake(() => {})
//const yarnUpgradeSpy = sinon.stub(ernUtil.yarn, 'yarnUpgrade').callsFake(() => {})
//const yarnInstallSpy = sinon.stub(ernUtil.yarn, 'yarnInstall').callsFake(() => {})
sinon.stub(ernUtil, 'spin').callsFake(async (msg, prom) => { await prom })

// Intercept log calls
global.log = {
  debug: () => {},
  error: console.log,
  warn: console.log,
  info: console.log
}

let tmpOutDir
const currentDir = process.cwd()
const pathToFixtures = path.join(currentDir, 'test', 'fixtures')
const pathToSampleYarnLock = path.join(pathToFixtures, 'sample.yarn.lock')
const sampleYarnLock = fs.readFileSync(pathToSampleYarnLock, 'utf8')

// Before each test
beforeEach(() => {
  // Go back to initial dir (otherwise we might start execution from a temporary
  // created directory that got removed and it makes shelljs go crazy)
  process.chdir(currentDir)

  // Reset the state of all spies
  yarnAddSpy.reset()
  yarnInstallSpy.reset()
  yarnUpgradeSpy.reset()

  // Create temporary directory to use as target output directory of some
  // functions under test
  tmpOutDir = tmp.dirSync().name
})

// After each test
afterEach(() => {
  // Remove the temporary output directory created for the test
  shell.rm('-rf', tmpOutDir)
})

// After all tests
after(() => {
  // Restore the functions that were spied on to their original code
  yarnAddSpy.restore()
  yarnInstallSpy.restore()
  yarnUpgradeSpy.restore()
})

// Utility function that returns true if a given async function execution
// throws an exception, false otherwise
// DUPLICATE : TO BE MOVED TO ERN-UTIL-DEV
async function doesThrow (asyncFn, ...args) {
  let threwError = false
  try {
    await asyncFn(...args)
  } catch (e) {
    threwError = true
  }
  return threwError
}

describe('ern-container-gen utils.js', () => {
  // ==========================================================
  // getMiniAppsDeltas
  // ==========================================================
  describe('getMiniAppsDeltas', () => {
    it('should compute new deltas', () => {
      const miniApps = [
        Dependency.fromString('MiniAppFour@1.0.0'),
        Dependency.fromString('MiniAppFive@1.0.0')
      ]
      const result = getMiniAppsDeltas(miniApps, sampleYarnLock)
      expect(result).to.have.property('new').that.is.a('array').lengthOf(2)
    })

    it('should compute same deltas', () => {
      const miniApps = [
        Dependency.fromString('MiniAppOne@6.0.0'),
        Dependency.fromString('MiniAppTwo@3.0.0')
      ]
      const result = getMiniAppsDeltas(miniApps, sampleYarnLock)
      expect(result).to.have.property('same').that.is.a('array').lengthOf(2)
    })

    it('should compute upgraded deltas', () => {
      const miniApps = [
        Dependency.fromString('MiniAppOne@7.0.0'),
        Dependency.fromString('MiniAppTwo@4.0.0')
      ]
      const result = getMiniAppsDeltas(miniApps, sampleYarnLock)
      expect(result).to.have.property('upgraded').that.is.a('array').lengthOf(2)
    })

    it('should compute deltas', () => {
      const miniApps = [
        Dependency.fromString('MiniAppOne@1.0.0'),
        Dependency.fromString('MiniAppTwo@3.0.0'),
        Dependency.fromString('MiniAppFour@1.0.0')
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
      assert(yarnAddSpy.calledTwice)
    })

    it('should yarn upgrade upgraded MiniApps', async () => {
      const miniAppsDeltas = {
        upgraded: [ { name: 'MiniAppOne', version: '7.0.0' }, { name: 'MiniAppTwo', version: '4.0.0' } ]
      }
      await runYarnUsingMiniAppDeltas(miniAppsDeltas)
      assert(yarnUpgradeSpy.calledTwice)
    })

    it('should not yarn upgrade nor yarn add same MiniApps versions', async () => {
      const miniAppsDeltas = {
        same: [ { name: 'MiniAppOne', version: '6.0.0' }, { name: 'MiniAppTwo', version: '3.0.0' } ]
      }
      await runYarnUsingMiniAppDeltas(miniAppsDeltas)
      assert(yarnUpgradeSpy.notCalled)
      assert(yarnAddSpy.notCalled)
    })

    it('should work correctly with mixed deltas', async () => {
      const miniAppsDeltas = {
        upgraded: [ { name: 'MiniAppOne', version: '7.0.0' }, { name: 'MiniAppTwo', version: '4.0.0' } ],
        same: [ { name: 'MiniAppOne', version: '6.0.0' }, { name: 'MiniAppTwo', version: '3.0.0' } ],
        new: [ { name: 'MiniAppFour', version: '7.0.0' } ]
      }
      await runYarnUsingMiniAppDeltas(miniAppsDeltas)
      assert(yarnUpgradeSpy.calledTwice)
      assert(yarnAddSpy.calledOnce)
    })
  })

  // ==========================================================
  // getPackageJsonDependenciesBasedOnMiniAppDeltas
  // ==========================================================
  describe('getPackageJsonDependenciesBasedOnMiniAppDeltas', () => {
    it('should inject MiniApps that have same version as previous', () => {
      const miniAppsDeltas = {
        same: [ { name: 'MiniAppOne', version: '6.0.0' }, { name: 'MiniAppTwo', version: '3.0.0' } ]
      }
      const result = getPackageJsonDependenciesUsingMiniAppDeltas(miniAppsDeltas, sampleYarnLock)
      expect(result).to.have.property('MiniAppOne', '6.0.0')
      expect(result).to.have.property('MiniAppTwo', '3.0.0')
    })

    it('should inject MiniApps that have upgraded versions', () => {
      const miniAppsDeltas = {
        upgraded: [ { name: 'MiniAppOne', version: '7.0.0' }, { name: 'MiniAppTwo', version: '4.0.0' } ]
      }
      const result = getPackageJsonDependenciesUsingMiniAppDeltas(miniAppsDeltas, sampleYarnLock)
      expect(result).to.have.property('MiniAppOne', '6.0.0')
      expect(result).to.have.property('MiniAppTwo', '3.0.0')
    })

    it('should not inject MiniApps that are new', () => {
      const miniAppsDeltas = {
        new: [ { name: 'MiniAppFour', version: '7.0.0' }, { name: 'MiniAppFive', version: '4.0.0' } ]
      }
      const result = getPackageJsonDependenciesUsingMiniAppDeltas(miniAppsDeltas, sampleYarnLock)
      expect(result).empty
    })

    it('should inject proper MiniApps', () => {
      const miniAppsDeltas = {
        new: [ { name: 'MiniAppFour', version: '7.0.0' } ],
        upgraded: [ { name: 'MiniAppTwo', version: '4.0.0' } ],
        same: [ { name: 'MiniAppOne', version: '6.0.0' } ]
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
      const miniApps = [DependencyPath.fromString('file:/Code/MiniApp')]
      assert(await doesThrow(generateMiniAppsComposite, miniApps, tmpOutDir, {pathToYarnLock: 'hello'}), 'No exception was thrown !')
    })

    it('should throw an exception if at least one of the MiniApp path is using a file scheme [2]', async () => {
      const miniApps = [DependencyPath.fromString('MiniAppOne@1.0.0'), DependencyPath.fromString('file:/Code/MiniApp')]
      assert(await doesThrow(generateMiniAppsComposite, miniApps, tmpOutDir, {pathToYarnLock: 'hello'}), 'No exception was thrown !')
    })

    it('should throw an exception if at least one of the MiniApp path is using a git scheme [1]', async () => {
      const miniApps = [DependencyPath.fromString('git://github.com:user/MiniAppRepo')]
      assert(await doesThrow(generateMiniAppsComposite, miniApps, tmpOutDir, {pathToYarnLock: 'hello'}), 'No exception was thrown !')
    })

    it('should throw an exception if at least one of the MiniApp path is using a git scheme [2]', async () => {
      const miniApps = [DependencyPath.fromString('MiniAppOne@1.0.0'), DependencyPath.fromString('git://github.com:user/MiniAppRepo')]
      assert(await doesThrow(generateMiniAppsComposite, miniApps, tmpOutDir, {pathToYarnLock: 'hello'}), 'No exception was thrown !')
    })

    it('should throw an exception if one of the MiniApp is not using an explicit version [1]', async () => {
      const miniApps = [DependencyPath.fromString('MiniAppOne')]
      assert(await doesThrow(generateMiniAppsComposite, miniApps, tmpOutDir, {pathToYarnLock: 'hello'}), 'No exception was thrown !')
    })

    it('should throw an exception if one of the MiniApp is not using an explicit version [1]', async () => {
      const miniApps = [DependencyPath.fromString('MiniAppOne'), DependencyPath.fromString('MiniAppTwo@1.0.0')]
      assert(await doesThrow(generateMiniAppsComposite, miniApps, tmpOutDir, {pathToYarnLock: 'hello'}), 'No exception was thrown !')
    })

    it('should throw an exception if path to yarn.lock does not exists', async () => {
      const miniApps = [DependencyPath.fromString('MiniAppOne@1.0.0'), DependencyPath.fromString('MiniAppTwo@1.0.0')]
      assert(await doesThrow(generateMiniAppsComposite, miniApps, tmpOutDir, {pathToYarnLock: path.join(tmpOutDir, 'yarn.lock')}), 'No exception was thrown !')
    })

    it('should call yarn install prior to calling yarn add or yarn upgrade for each MiniApp', async () => {
      // One new, one same, one upgrade
      const miniApps = [
        DependencyPath.fromString('MiniAppOne@6.0.0'), // same
        DependencyPath.fromString('MiniAppTwo@4.0.0'), // upgraded
        DependencyPath.fromString('MiniAppFour@1.0.0') // new
      ]
      await generateMiniAppsComposite(miniApps, tmpOutDir, { pathToYarnLock: pathToSampleYarnLock })
      assert(yarnInstallSpy.calledOnce)
      assert(yarnUpgradeSpy.calledOnce)
      assert(yarnAddSpy.calledOnce)
      assert(yarnInstallSpy.calledBefore(yarnAddSpy))
      assert(yarnInstallSpy.calledBefore(yarnUpgradeSpy))
    })

    it('should create index.android.js', async () => {
      // One new, one same, one upgrade
      const miniApps = [
        DependencyPath.fromString('MiniAppOne@6.0.0')
      ]
      await generateMiniAppsComposite(miniApps, tmpOutDir, { pathToYarnLock: pathToSampleYarnLock })
      assert(fs.existsSync(path.join(tmpOutDir, 'index.android.js')))
    })

    it('should create index.ios.js', async () => {
      // One new, one same, one upgrade
      const miniApps = [
        DependencyPath.fromString('MiniAppOne@6.0.0')
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
        DependencyPath.fromString('MiniAppOne@6.0.0'), // same
        DependencyPath.fromString('MiniAppTwo@4.0.0'), // upgraded
        DependencyPath.fromString('MiniAppFour@1.0.0') // new
      ]
      fs.writeFileSync(path.join(tmpOutDir, 'package.json'), JSON.stringify({
        dependencies: {
          MiniAppOne: '6.0.0',
          MiniAppTwo: '4.0.0',
          MiniAppFour: '1.0.0'
        }
      }), 'utf8')
      await generateMiniAppsComposite(miniApps, tmpOutDir)
      assert(yarnAddSpy.calledThrice)
    })

    it('should create index.android.js', async () => {
      // One new, one same, one upgrade
      const miniApps = [
        DependencyPath.fromString('MiniAppOne@6.0.0')
      ]
      // Because in the case of no yarn lock provided the package.json
      // is created when running first yarn add, and we are using a yarnAdd
      // stub that is not going to run real yarn add, we need to create the
      // expected package.json beforehand
      fs.writeFileSync(path.join(tmpOutDir, 'package.json'), JSON.stringify({
        dependencies: {
          MiniAppOne: '6.0.0'
        }
      }), 'utf8')
      await generateMiniAppsComposite(miniApps, tmpOutDir)
      assert(fs.existsSync(path.join(tmpOutDir, 'index.android.js')))
    })

    it('should create index.ios.js', async () => {
      // One new, one same, one upgrade
      const miniApps = [
        DependencyPath.fromString('MiniAppOne@6.0.0')
      ]
      // Because in the case of no yarn lock provided the package.json
      // is created when running first yarn add, and we are using a yarnAdd
      // stub that is not going to run real yarn add, we need to create the
      // expected package.json beforehand
      fs.writeFileSync(path.join(tmpOutDir, 'package.json'), JSON.stringify({
        dependencies: {
          MiniAppOne: '6.0.0'
        }
      }), 'utf8')
      await generateMiniAppsComposite(miniApps, tmpOutDir)
      assert(fs.existsSync(path.join(tmpOutDir, 'index.android.js')))
    })
  })
})
