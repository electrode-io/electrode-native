import {
  expect,
  assert
} from 'chai'
import sinon from 'sinon'
import Utils from '../src/utils'

// Logging stubs
const logErrorStub = sinon.stub()
const logDebugStub = sinon.stub()
const processExitStub = sinon.stub(process, 'exit')

global.log = {
  error: logErrorStub,
  debug: logDebugStub
}

describe('Utils', () => {
  it('test logErrorAndExitProcess', () => {
    Utils.logErrorAndExitProcess(new Error('test error'), 1)
    sinon.assert.calledOnce(logErrorStub)
    sinon.assert.calledWith(logErrorStub, 'An error occurred: test error')
    sinon.assert.calledOnce(processExitStub)
    sinon.assert.calledWith(processExitStub, 1)
  })

  it('test logErrorAndExitProcess with arguments', () => {
    const error = new Error('test error')
    Utils.logErrorAndExitProcess(new Error('test error'), 1)
    sinon.assert.calledWith(logErrorStub, 'An error occurred: test error')
    assert(logDebugStub.calledAfter(logErrorStub))
    sinon.assert.calledWith(processExitStub, 1)
  })
})