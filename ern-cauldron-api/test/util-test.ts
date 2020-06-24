import { expect } from 'chai';
import * as util from '../src/util';

describe('util.js', () => {
  describe('exists', () => {
    it('should return true if the object with given name exists in the collection', () => {
      const result = util.exists(
        [{ name: 'walmart' }, { name: 'electrode' }],
        'walmart',
      );
      expect(result).true;
    });

    it('should return false if the object with given name does not exist in the collection', () => {
      const result = util.exists(
        [{ name: 'walmart' }, { name: 'electrode' }],
        'foo',
      );
      expect(result).false;
    });

    it('should return true if the object with given name and version exists in the collection', () => {
      const result = util.exists(
        [{ name: 'walmart' }, { name: 'electrode', version: '1.0.0' }],
        'electrode',
        '1.0.0',
      );
      expect(result).true;
    });

    it('should return false if the object with given name and version does not exists in the collection', () => {
      const result = util.exists(
        [{ name: 'walmart' }, { name: 'electrode', version: '1.0.0' }],
        'electrode',
        '0.0.0',
      );
      expect(result).false;
    });
  });

  describe('buildNativeBinaryFileName', () => {
    it('should return the correct file name of Android binary', () => {
      const result = util.buildNativeBinaryFileName(
        'walmart',
        'android',
        '17.7.0',
      );
      expect(result).eql('walmart-android@17.7.0.apk');
    });

    it('should return the correct file name of iOS binary', () => {
      const result = util.buildNativeBinaryFileName('walmart', 'ios', '17.7.0');
      expect(result).eql('walmart-ios@17.7.0.app');
    });
  });

  describe('getNativeBinaryFileExt', () => {
    it('should return the correct file name extension for Android', () => {
      const result = util.getNativeBinaryFileExt('android');
      expect(result).eql('apk');
    });

    it('should return the correct file name extension for iOS', () => {
      const result = util.getNativeBinaryFileExt('ios');
      expect(result).eql('app');
    });
  });

  describe('normalizeCauldronFilePath', () => {
    it('should return the path as such for a non cauldron scheme path', () => {
      const result = util.normalizeCauldronFilePath('dir/file');
      expect(result).eql('dir/file');
    });

    it('should remove the cauldron scheme for a cauldron scheme path', () => {
      const result = util.normalizeCauldronFilePath('cauldron://dir/file');
      expect(result).eql('dir/file');
    });
  });

  describe('getSchemaVersionMatchingCauldronApiVersion', () => {
    it('should return 3.0.0 for version 1000.0.0', () => {
      const result = util.getSchemaVersionMatchingCauldronApiVersion(
        '1000.0.0',
      );
      expect(result).eql('3.0.0');
    });

    it('should return 1.0.0 for version 0.12.0', () => {
      const result = util.getSchemaVersionMatchingCauldronApiVersion('0.12.0');
      expect(result).eql('1.0.0');
    });

    it('should return 2.0.0 for version 0.25.0', () => {
      const result = util.getSchemaVersionMatchingCauldronApiVersion('0.25.0');
      expect(result).eql('2.0.0');
    });

    it('should return 3.0.0 for version 0.32.0', () => {
      const result = util.getSchemaVersionMatchingCauldronApiVersion('0.32.0');
      expect(result).eql('3.0.0');
    });

    it('should return 0.0.0 for version 0.50.0', () => {
      const result = util.getSchemaVersionMatchingCauldronApiVersion('0.50.0');
      expect(result).eql('0.0.0');
    });
  });
});
