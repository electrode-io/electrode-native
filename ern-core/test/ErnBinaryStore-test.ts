import { ErnBinaryStore } from '../src/ErnBinaryStore'
import { AppVersionDescriptor } from '../src/descriptors'
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
    execpReturn = '200',
  }: {
    execpReturn?: any
  } = {}) {
    execpStub.resolves(execpReturn)
  }

  const descriptor = AppVersionDescriptor.fromString('test:android:17.7.0')
  const binaryStoreUrl = 'http://binarystore'
  const createBinaryStore = () => new ErnBinaryStore({ url: binaryStoreUrl })
  const fakeBinaryApkPath = path.join(
    __dirname,
    'fixtures/ErnBinaryStore/fakebinary.apk'
  )

  describe('addBinary', () => {
    const httpCurlPostRe = /curl -XPOST http:\/\/binarystore -F file=@"(.+)"/

    it('should use curl to POST the zipped binary to the binary store server', async () => {
      const sut = createBinaryStore()
      await sut.addBinary(descriptor, fakeBinaryApkPath)
      sandbox.assert.calledWith(execpStub, sinon.match(httpCurlPostRe))
    })
  })

  describe('removeBinary', () => {
    it('should use curl to DELETE the binary from the binary store [non flavored]', async () => {
      prepareStubs()
      const sut = createBinaryStore()
      await sut.removeBinary(descriptor)
      sandbox.assert.calledWith(
        execpStub,
        sinon.match('curl -XDELETE http://binarystore/test-android-17.7.0.zip')
      )
    })

    it('should use curl to DELETE the binary from the binary store [flavored]', async () => {
      prepareStubs()
      const sut = createBinaryStore()
      await sut.removeBinary(descriptor, { flavor: 'QA' })
      sandbox.assert.calledWith(
        execpStub,
        sinon.match(
          'curl -XDELETE http://binarystore/test-android-17.7.0-QA.zip'
        )
      )
    })

    it('should throw if the binary does not exist', async () => {
      prepareStubs({ execpReturn: '404' })
      const sut = createBinaryStore()
      assert(await doesThrow(sut.removeBinary, sut, descriptor))
    })
  })

  describe('getBinary', () => {
    it('should throw if the binary does not exist', async () => {
      prepareStubs({ execpReturn: '404' })
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

    it('should properly name the zip file [non flavored]', async () => {
      prepareStubs()
      const sut = createBinaryStore()
      const zippedBinaryPath = await sut.zipBinary(
        descriptor,
        fakeBinaryApkPath
      )
      const actualZipFileName = path.basename(zippedBinaryPath)
      expect(actualZipFileName).eql('test-android-17.7.0.zip')
    })

    it('should properly name the zip file [flavored]', async () => {
      prepareStubs()
      const sut = createBinaryStore()
      const zippedBinaryPath = await sut.zipBinary(
        descriptor,
        fakeBinaryApkPath,
        { flavor: 'QA' }
      )
      const actualZipFileName = path.basename(zippedBinaryPath)
      expect(actualZipFileName).eql('test-android-17.7.0-QA.zip')
    })
  })

  describe('buildZipBinaryFileName', () => {
    it('should build the correct file name [non flavored]', () => {
      prepareStubs()
      const sut = createBinaryStore()
      const fileName = sut.buildZipBinaryFileName(descriptor)
      expect(fileName).eql('test-android-17.7.0.zip')
    })

    it('should build the correct file name [flavored]', () => {
      const sut = createBinaryStore()
      const fileName = sut.buildZipBinaryFileName(descriptor, { flavor: 'QA' })
      expect(fileName).eql('test-android-17.7.0-QA.zip')
    })
  })

  describe('buildNativeBinaryFileName', () => {
    it('should build the correct file name [non flavored]', () => {
      prepareStubs()
      const sut = createBinaryStore()
      const fileName = sut.buildNativeBinaryFileName(descriptor)
      expect(fileName).eql('test-android-17.7.0.apk')
    })

    it('should build the correct file name [flavored]', () => {
      const sut = createBinaryStore()
      const fileName = sut.buildNativeBinaryFileName(descriptor, {
        flavor: 'QA',
      })
      expect(fileName).eql('test-android-17.7.0-QA.apk')
    })
  })
})
