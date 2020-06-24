import { ErnBinaryStore } from '../src/ErnBinaryStore';
import { AppVersionDescriptor } from '../src/descriptors';
import { doesThrow } from 'ern-util-dev';
import path from 'path';
import sinon from 'sinon';
import { assert, expect } from 'chai';
import nock from 'nock';

const sandbox = sinon.createSandbox();

describe('ErnBinaryStore', () => {
  afterEach(() => {
    sandbox.restore();
    nock.cleanAll();
  });

  const descriptor = AppVersionDescriptor.fromString('test:android:17.7.0');
  const binaryStoreUrl = 'http://binarystore.test';
  const createBinaryStore = () => new ErnBinaryStore({ url: binaryStoreUrl });
  const fakeBinaryApkPath = path.join(
    __dirname,
    'fixtures/ErnBinaryStore/fakebinary.apk',
  );
  const testDescriptor = AppVersionDescriptor.fromString('test:android:1.0.0');
  const testDescriptorFile = 'test-android-1.0.0.zip';
  const testDescriptorFlavoredFile = 'test-android-1.0.0-prod.zip';

  describe('hasBinary', () => {
    it('should build the correct path [flavored]', (done) => {
      const n = nock(binaryStoreUrl).head(/.*/).reply(200);
      n.on('request', (req) => {
        expect(req.path).equal(`/${testDescriptorFlavoredFile}`);
        done();
      });
      const sut = createBinaryStore();
      sut.hasBinary(testDescriptor, {
        flavor: 'prod',
      });
    });

    it('should build the correct path [unflavored]', (done) => {
      const n = nock(binaryStoreUrl).head(/.*/).reply(200);
      n.on('request', (req) => {
        expect(req.path).equal(`/${testDescriptorFile}`);
        done();
      });
      const sut = createBinaryStore();
      sut.hasBinary(testDescriptor);
    });

    it('should return false if the server returns 404 not found', async () => {
      nock(binaryStoreUrl).head(`/${testDescriptorFile}`).reply(404);
      const sut = createBinaryStore();
      const res = await sut.hasBinary(testDescriptor);
      expect(res).false;
    });

    it('should return true if the server returns 200 ok', async () => {
      nock(binaryStoreUrl).head(`/${testDescriptorFile}`).reply(200);
      const sut = createBinaryStore();
      const res = await sut.hasBinary(testDescriptor);
      expect(res).true;
    });

    it('should throw if the server returns an error status code', async () => {
      nock(binaryStoreUrl).head(`/${testDescriptorFile}`).reply(500);
      const sut = createBinaryStore();
      assert(await doesThrow(sut.hasBinary, sut, testDescriptor));
    });
  });

  describe('removeBinary', () => {
    it('should build the correct path [flavored]', (done) => {
      nock(binaryStoreUrl).head(`/${testDescriptorFlavoredFile}`).reply(200);
      const n = nock(binaryStoreUrl).delete(/.*/).reply(200);
      n.on('request', (req) => {
        expect(req.path).equal(`/${testDescriptorFlavoredFile}`);
        done();
      });
      const sut = createBinaryStore();
      sut.removeBinary(testDescriptor, {
        flavor: 'prod',
      });
    });

    it('should build the correct path [unflavored]', (done) => {
      nock(binaryStoreUrl).head(`/${testDescriptorFile}`).reply(200);
      const n = nock(binaryStoreUrl).delete(/.*/).reply(200);
      n.on('request', (req) => {
        expect(req.path).equal(`/${testDescriptorFile}`);
        done();
      });
      const sut = createBinaryStore();
      sut.removeBinary(testDescriptor);
    });

    it('should not throw if the server returns a success status code', async () => {
      nock(binaryStoreUrl).head(`/${testDescriptorFile}`).reply(200);
      nock(binaryStoreUrl).delete(`/${testDescriptorFile}`).reply(200);
      const sut = createBinaryStore();
      await sut.removeBinary(testDescriptor);
    });

    it('should throw if the server returns an error status code', async () => {
      nock(binaryStoreUrl).head(`/${testDescriptorFile}`).reply(200);
      nock(binaryStoreUrl).delete(`/${testDescriptorFile}`).reply(500);
      const sut = createBinaryStore();
      assert(await doesThrow(sut.removeBinary, sut, testDescriptor));
    });

    it('should throw if the server does not have the specified binary', async () => {
      nock(binaryStoreUrl).head(`/${testDescriptorFile}`).reply(404);
      nock(binaryStoreUrl).delete(`/${testDescriptorFile}`).reply(200);
      const sut = createBinaryStore();
      assert(await doesThrow(sut.removeBinary, sut, testDescriptor));
    });
  });

  describe('zipBinary', () => {
    it('should create a zip file of the binary', async () => {
      const sut = createBinaryStore();
      const zippedBinaryPath = await sut.zipBinary(
        descriptor,
        fakeBinaryApkPath,
      );
    });

    it('should properly name the zip file [non flavored]', async () => {
      const sut = createBinaryStore();
      const zippedBinaryPath = await sut.zipBinary(
        descriptor,
        fakeBinaryApkPath,
      );
      const actualZipFileName = path.basename(zippedBinaryPath);
      expect(actualZipFileName).eql('test-android-17.7.0.zip');
    });

    it('should properly name the zip file [flavored]', async () => {
      const sut = createBinaryStore();
      const zippedBinaryPath = await sut.zipBinary(
        descriptor,
        fakeBinaryApkPath,
        { flavor: 'QA' },
      );
      const actualZipFileName = path.basename(zippedBinaryPath);
      expect(actualZipFileName).eql('test-android-17.7.0-QA.zip');
    });
  });

  describe('buildZipBinaryFileName', () => {
    it('should build the correct file name [non flavored]', () => {
      const sut = createBinaryStore();
      const fileName = sut.buildZipBinaryFileName(descriptor);
      expect(fileName).eql('test-android-17.7.0.zip');
    });

    it('should build the correct file name [flavored]', () => {
      const sut = createBinaryStore();
      const fileName = sut.buildZipBinaryFileName(descriptor, { flavor: 'QA' });
      expect(fileName).eql('test-android-17.7.0-QA.zip');
    });
  });

  describe('buildNativeBinaryFileName', () => {
    it('should build the correct file name [non flavored]', () => {
      const sut = createBinaryStore();
      const fileName = sut.buildNativeBinaryFileName(descriptor);
      expect(fileName).eql('test-android-17.7.0.apk');
    });

    it('should build the correct file name [flavored]', () => {
      const sut = createBinaryStore();
      const fileName = sut.buildNativeBinaryFileName(descriptor, {
        flavor: 'QA',
      });
      expect(fileName).eql('test-android-17.7.0-QA.apk');
    });
  });
});
