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
import Utils from '../src/utils'

const processExitStub = sinon.stub(process, 'exit')

describe('Utils', () => {
  let stubs

  beforeEach(() => {
    stubs = beforeTest()
  })

  afterEach(() => {
    afterTest()
  })

  it('test logErrorAndExitProcess', () => {
    Utils.logErrorAndExitProcess(new Error('test error'), 1)
    sinon.assert.calledOnce(stubs.log.error)
    sinon.assert.calledWith(stubs.log.error, 'An error occurred: test error')
    sinon.assert.calledOnce(processExitStub)
    sinon.assert.calledWith(processExitStub, 1)
  })

  it('test logErrorAndExitProcess with arguments', () => {
    Utils.logErrorAndExitProcess(new Error('test error'), 1)
    sinon.assert.calledWith(stubs.log.error, 'An error occurred: test error')
    assert(stubs.log.debug.calledAfter(stubs.log.error))
    sinon.assert.calledWith(processExitStub, 1)
  })
})