import { assert, expect } from 'chai';
import { FsCache, maxDefaultCacheSize } from '../src/FsCache';
import { rejects } from 'assert';
import shell from '../src/shell';
import path from 'path';
import fs from 'fs';

const testRootCachePath = path.join(__dirname, 'tmp');

/**
 * These tests are using string as the cached object type, for simplicity.
 * objectToId will return the string itself
 */
describe('FsCache', () => {
  afterEach(() => {
    shell.rm('-rf', testRootCachePath);
  });

  describe('constructor', () => {
    it('should successfully create a new instance given valid parameters', () => {
      const sut = new FsCache<string>({
        addObjectToCacheDirectory: async (obj: string, dirPath: string) =>
          Promise.resolve(),
        objectToId: (obj: string) => obj,
        rootCachePath: testRootCachePath,
      });
      expect(sut).not.undefined;
    });

    it('should create the root cache directory if it does not exist', () => {
      const sut = new FsCache<string>({
        addObjectToCacheDirectory: async (obj: string, dirPath: string) =>
          Promise.resolve(),
        objectToId: (obj: string) => '1',
        rootCachePath: testRootCachePath,
      });
      expect(fs.existsSync(testRootCachePath)).true;
    });

    it('should property set the rootCachePath', () => {
      const sut = new FsCache<string>({
        addObjectToCacheDirectory: async (obj: string, dirPath: string) =>
          Promise.resolve(),
        objectToId: (obj: string) => '1',
        rootCachePath: testRootCachePath,
      });
      expect(sut.rootCachePath).eql(testRootCachePath);
    });

    it('should use default cache size if not provided', () => {
      const sut = new FsCache<string>({
        addObjectToCacheDirectory: async (obj: string, dirPath: string) =>
          Promise.resolve(),
        objectToId: (obj: string) => '1',
        rootCachePath: testRootCachePath,
      });
      expect(sut.maxCacheSize).eql(maxDefaultCacheSize);
    });

    it('should use provided cache size', () => {
      const sut = new FsCache<string>({
        addObjectToCacheDirectory: async (obj: string, dirPath: string) =>
          Promise.resolve(),
        maxCacheSize: 1000,
        objectToId: (obj: string) => '1',
        rootCachePath: testRootCachePath,
      });
      expect(sut.maxCacheSize).eql(1000);
    });
  });

  describe('isInCache', () => {
    it('should return false if object is not in cache', async () => {
      const sut = new FsCache<string>({
        addObjectToCacheDirectory: async (obj: string, dirPath: string) =>
          Promise.resolve(),
        objectToId: (obj: string) => obj,
        rootCachePath: testRootCachePath,
      });
      const isAStringInCache = await sut.isInCache('AString');
      expect(isAStringInCache).false;
    });

    it('should return true if object is in cache', async () => {
      const sut = new FsCache<string>({
        addObjectToCacheDirectory: async (obj: string, dirPath: string) =>
          Promise.resolve(),
        objectToId: (obj: string) => obj,
        rootCachePath: testRootCachePath,
      });
      await sut.addToCache('AString');
      const isAStringInCache = await sut.isInCache('AString');
      expect(isAStringInCache).true;
    });
  });

  describe('addToCache', () => {
    it('should throw if object is already in cache', async () => {
      const sut = new FsCache<string>({
        addObjectToCacheDirectory: async (obj: string, dirPath: string) =>
          Promise.resolve(),
        objectToId: (obj: string) => obj,
        rootCachePath: testRootCachePath,
      });
      await sut.addToCache('AString');
      assert(rejects(sut.addToCache('AString')));
    });

    // TODO: Restructure tests
    // Intermittently fails on Windows test runners:
    // Error: EPERM: operation not permitted, open 'D:\a\1\s\ern-core\test\tmp\cache-manifest.json'
    it.skip('should add the object to the cache', async () => {
      const sut = new FsCache<string>({
        addObjectToCacheDirectory: async (obj: string, dirPath: string) =>
          Promise.resolve(),
        objectToId: (obj: string) => obj,
        rootCachePath: testRootCachePath,
      });
      await sut.addToCache('AString');
      assert(await sut.isInCache('AString'));
    });
  });

  describe('getObjectCachePath', () => {
    it('should return path to cache directory containing object', async () => {
      const sut = new FsCache<string>({
        addObjectToCacheDirectory: async (obj: string, dirPath: string) =>
          Promise.resolve(),
        objectToId: (obj: string) => obj,
        rootCachePath: testRootCachePath,
      });
      await sut.addToCache('AString');
      const pathToObjectDirectoryCache = await sut.getObjectCachePath(
        'AString',
      );
      expect(pathToObjectDirectoryCache).not.undefined;
    });

    it('should return undefined if object is not in cache', async () => {
      const sut = new FsCache<string>({
        addObjectToCacheDirectory: async (obj: string, dirPath: string) =>
          Promise.resolve(),
        objectToId: (obj: string) => obj,
        rootCachePath: testRootCachePath,
      });
      const pathToObjectDirectoryCache = await sut.getObjectCachePath(
        'AString',
      );
      expect(pathToObjectDirectoryCache).undefined;
    });
  });
});
