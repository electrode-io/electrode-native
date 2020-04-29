import * as core from 'ern-core'
import * as build from '../src/buildIosRunner'
import { launchOnSimulator } from '../src/launchOnSimulator'
import sinon from 'sinon'

const sandbox = sinon.createSandbox()

describe('launchOnSimulator', () => {
  const devices = ['iPhone X']
  let askUserDeviceStub: any
  let killAllRunningSimulatorsStub: any
  let launchSimulatorStub: any
  let installApplicationOnSimulatorStub: any
  let launchApplicationStub: any
  let buildIosRunnerStub: any

  beforeEach(() => {
    askUserDeviceStub = sandbox
      .stub(core.ios, 'askUserToSelectAniPhoneSimulator')
      .resolves({
        name: 'iPhone X',
        udid: 'DB3D6BC0-BB08-4340-8D03-A87D69E5BEA6',
        version: '11.3',
      })
    killAllRunningSimulatorsStub = sandbox.stub(
      core.ios,
      'killAllRunningSimulators'
    )
    launchSimulatorStub = sandbox.stub(core.ios, 'launchSimulator')
    installApplicationOnSimulatorStub = sandbox.stub(
      core.ios,
      'installApplicationOnSimulator'
    )
    launchApplicationStub = sandbox.stub(core.ios, 'launchApplication')
    sandbox.stub(core.shell)
    buildIosRunnerStub = sandbox.stub(build, 'buildIosRunner')
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('should ask the user to select an iOS device', async () => {
    await launchOnSimulator('/Users/foo/test')
    sandbox.assert.calledOnce(askUserDeviceStub)
  })

  it('should kill all running simulators', async () => {
    await launchOnSimulator('/Users/foo/test')
    sandbox.assert.calledOnce(killAllRunningSimulatorsStub)
  })

  it('should launch the simulator', async () => {
    await launchOnSimulator('/Users/foo/test')
    sandbox.assert.calledWith(
      launchSimulatorStub,
      'DB3D6BC0-BB08-4340-8D03-A87D69E5BEA6'
    )
  })

  it('should build the iOS runner', async () => {
    await launchOnSimulator('/Users/foo/test')
    sandbox.assert.calledWith(
      buildIosRunnerStub,
      '/Users/foo/test',
      'DB3D6BC0-BB08-4340-8D03-A87D69E5BEA6'
    )
  })

  it('should install the iOS runner on the simulator', async () => {
    await launchOnSimulator('/Users/foo/test')
    sandbox.assert.calledWith(
      installApplicationOnSimulatorStub,
      'DB3D6BC0-BB08-4340-8D03-A87D69E5BEA6',
      '/Users/foo/test/build/Debug-iphonesimulator/ErnRunner.app'
    )
  })

  it('should launch the iOS runner on the simulator', async () => {
    await launchOnSimulator('/Users/foo/test')
    sandbox.assert.calledWith(
      launchApplicationStub,
      'DB3D6BC0-BB08-4340-8D03-A87D69E5BEA6',
      'com.yourcompany.ernrunner'
    )
  })
})
