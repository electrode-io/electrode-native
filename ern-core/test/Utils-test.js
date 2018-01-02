// @flow

import {
  expect,
  assert
} from 'chai'
import {
  beforeTest,
  afterTest
} from 'ern-util-dev'
import sinon from 'sinon'
import * as coreUtils from '../src/utils'
const sanbox = sinon.createSandbox()

let processExitStub

describe('Utils', () => {
  let stubs

  beforeEach(() => {
    processExitStub = sanbox.stub(process, 'exit')
    stubs = beforeTest()
  })

  afterEach(() => {
    sanbox.restore()
    afterTest()
  })

  it('test logErrorAndExitProcess', () => {
    coreUtils.logErrorAndExitProcess(new Error('test error'), 1)
    sinon.assert.calledOnce(stubs.log.error)
    sinon.assert.calledWith(stubs.log.error, 'An error occurred: test error')
    sinon.assert.calledOnce(processExitStub)
    sinon.assert.calledWith(processExitStub, 1)
  })

  it('test logErrorAndExitProcess with arguments', () => {
    coreUtils.logErrorAndExitProcess(new Error('test error'), 1)
    sinon.assert.calledWith(stubs.log.error, 'An error occurred: test error')
    assert(stubs.log.debug.calledAfter(stubs.log.error))
    sinon.assert.calledWith(processExitStub, 1)
  })
})