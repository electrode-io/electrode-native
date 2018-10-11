import sinon from 'sinon'
import * as coreUtils from '../src/utils'
import log from '../src/log'
import { NativeApplicationDescriptor } from '../src/NativeApplicationDescriptor'
const sandbox = sinon.createSandbox()
import { expect } from 'chai'

let processExitStub
let logStub

describe('Core Utils', () => {
  beforeEach(() => {
    processExitStub = sandbox.stub(process, 'exit')
    logStub = sandbox.stub(log)
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('logErrorAndExitProcess', () => {
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

  describe('coerceToNativeApplicationDescriptor', () => {
    it('should coerce a string to a NativeApplicationDescriptor', () => {
      expect(
        coreUtils.coerceToNativeApplicationDescriptor('test:android:1.0.0')
      ).eql(NativeApplicationDescriptor.fromString('test:android:1.0.0'))
    })

    it('should coerce a NativeApplicationDescriptor to a NativeApplicationDescriptor (noop)', () => {
      const descriptor = NativeApplicationDescriptor.fromString(
        'test:android:1.0.0'
      )
      expect(coreUtils.coerceToNativeApplicationDescriptor(descriptor)).eql(
        descriptor
      )
    })
  })

  describe('coerceToNativeApplicationDescriptorArray', () => {
    it('should coerce a string to a NativeApplicationDescriptor array', () => {
      const descriptor = NativeApplicationDescriptor.fromString(
        'test:android:1.0.0'
      )
      const result = coreUtils.coerceToNativeApplicationDescriptorArray(
        'test:android:1.0.0'
      )
      expect(result)
        .is.an('array')
        .of.length(1)
      expect(result[0]).eql(descriptor)
    })

    it('should coerce a NativeApplicationDescriptor to a NativeApplicationDescriptor array', () => {
      const descriptor = NativeApplicationDescriptor.fromString(
        'test:android:1.0.0'
      )
      const result = coreUtils.coerceToNativeApplicationDescriptorArray(
        descriptor
      )
      expect(result)
        .is.an('array')
        .of.length(1)
      expect(result[0]).eql(descriptor)
    })

    it('should coerce a string|NativeApplication descriptor mixed array to a NativeApplicationDescriptor arry', () => {
      const descriptorA = NativeApplicationDescriptor.fromString(
        'test:android:1.0.0'
      )
      const descriptorB = NativeApplicationDescriptor.fromString(
        'test:android:2.0.0'
      )
      const result = coreUtils.coerceToNativeApplicationDescriptorArray([
        'test:android:1.0.0',
        descriptorB,
      ])
      expect(result)
        .is.an('array')
        .of.length(2)
      expect(result[0]).eql(descriptorA)
      expect(result[1]).eql(descriptorB)
    })
  })
})
