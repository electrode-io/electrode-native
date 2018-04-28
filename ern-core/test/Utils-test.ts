import sinon from 'sinon'
import * as coreUtils from '../src/utils'
import log from '../src/log'
const sandbox = sinon.createSandbox()

let processExitStub
let logStub

describe('Utils', () => {
  beforeEach(() => {
    processExitStub = sandbox.stub(process, 'exit')
    logStub = sandbox.stub(log)
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('test logErrorAndExitProcess', () => {
    coreUtils.logErrorAndExitProcess(new Error('test error'), 1)
    sinon.assert.calledOnce(logStub.error)
    sinon.assert.calledWith(logStub.error, 'An error occurred: test error')
    sinon.assert.calledOnce(processExitStub)
    sinon.assert.calledWith(processExitStub, 1)
  })

  it('test logErrorAndExitProcess with arguments', () => {
    coreUtils.logErrorAndExitProcess(new Error('test error'), 1)
    sinon.assert.calledWith(logStub.error, 'An error occurred: test error')
    sinon.assert.calledWith(processExitStub, 1)
  })
})
