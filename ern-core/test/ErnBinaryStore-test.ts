import { ErnBinaryStore } from '../src/ErnBinaryStore'
import { NativeApplicationDescriptor } from '../src/NativeApplicationDescriptor'
import * as coreChildProcess from '../src/childProcess'
import { doesThrow } from 'ern-util-dev'
import fs from 'fs'
import path from 'path'
import sinon from 'sinon'
import { assert, expect } from 'chai'

const sandbox = sinon.createSandbox()

describe('ErnBinaryStore', () => {
  let execpStub

  beforeEach(() => {
    execpStub = sandbox.stub(coreChildProcess, 'execp')
  })

  afterEach(() => {
    sandbox.restore()
  })

  function prepareStubs({
    execpReturn = true,
  }: {
    execpReturn?: any
  } = {}) {
    execpStub.returns(execpReturn)
  }

  const descriptor = NativeApplicationDescriptor.fromString(
    'test:android:17.7.0'
  )
  const binaryStoreUrl = 'http://binarystore'
  const createBinaryStore = () => new ErnBinaryStore({ url: binaryStoreUrl })
  const fakeBinaryApkPath = path.join(
    __dirname,
    'fixtures',
    'ErnBinaryStore',
    'fakebinary.apk'
  )
  const fakeBinaryZippedPath = path.join(
    __dirname,
    'fixtures',
    'ErnBinaryStore',
    'test-android-17.7.0.zip'
  )
  const expectedFakeBinaryZipContent = fs
    .readFileSync(fakeBinaryZippedPath)
    .toString()

  describe('addBinary', () => {
    const httpCurlPostRe = /curl -XPOST http:\/\/binarystore -F file=@"(.+)"/

    it('should use curl to POST the zipped binary to the binary store server', async () => {
      const sut = createBinaryStore()
      await sut.addBinary(descriptor, fakeBinaryApkPath)
      sandbox.assert.calledWith(execpStub, sinon.match(httpCurlPostRe))
    })
  })

  describe('removeBinary', () => {
    it('should use curl to DELETE the binary from the binary store', async () => {
      prepareStubs()
      const sut = createBinaryStore()
      await sut.removeBinary(descriptor)
      sandbox.assert.calledWith(
        execpStub,
        sinon.match('curl -XDELETE http://binarystore/test-android-17.7.0.zip')
      )
    })

    it('should throw if the binary does not exist', async () => {
      prepareStubs({ execpReturn: false })
      const sut = createBinaryStore()
      assert(await doesThrow(sut.removeBinary, sut, descriptor))
    })
  })

  describe('getBinary', () => {
    it('should throw if the binary does not exist', async () => {
      prepareStubs({ execpReturn: false })
      const sut = createBinaryStore()
      assert(await doesThrow(sut.getBinary, sut, descriptor))
    })
  })

  describe('zipBinary', () => {
    it('should create a zip file of the binary', async () => {
      prepareStubs()
      const sut = createBinaryStore()
      const zippedBinaryPath = await sut.zipBinary(
        descriptor,
        fakeBinaryApkPath
      )
    })

    it('should properly name the zip file', async () => {
      prepareStubs()
      const sut = createBinaryStore()
      const zippedBinaryPath = await sut.zipBinary(
        descriptor,
        fakeBinaryApkPath
      )
      const actualZipFileName = path.basename(zippedBinaryPath)
      expect(actualZipFileName).eql('test-android-17.7.0.zip')
    })
  })
})
