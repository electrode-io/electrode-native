import { JsonFileErnConfig } from '../../src/config';
import createTmpDir from '../../src/createTmpDir';
import { expect } from 'chai';
import fs from 'fs';
import path from 'path';

describe('JsonFileErnConfig', () => {
  function createTmpFileWithContent(obj: any): string {
    const configFilePath = getTmpConfigFilePath();
    fs.writeFileSync(configFilePath, JSON.stringify(obj));
    return configFilePath;
  }

  function getTmpConfigFilePath() {
    const tmpDir = createTmpDir();
    return path.join(tmpDir, 'conf.json');
  }

  describe('get', () => {
    it('should return the value associated to the given key', () => {
      const sut = new JsonFileErnConfig(
        createTmpFileWithContent({ testKey: 'testValue' }),
      );
      expect(sut.get('testKey')).equal('testValue');
    });

    it('should return undefined if the key does not exist and no defaultValue was provided', () => {
      const sut = new JsonFileErnConfig(getTmpConfigFilePath());
      expect(sut.get('testKey')).undefined;
    });

    it('should return the provided defaultValue if the key does not exist', () => {
      const sut = new JsonFileErnConfig(getTmpConfigFilePath());
      expect(sut.get('testKey', 'testDefaultValue')).equal('testDefaultValue');
    });
  });

  describe('set', () => {
    it('should create the key if it does not exist', () => {
      const sut = new JsonFileErnConfig(getTmpConfigFilePath());
      sut.set('testKey', 'testValue');
      expect(sut.get('testKey')).equal('testValue');
    });

    it('should overwritte previous value of key if key exist', () => {
      const sut = new JsonFileErnConfig(
        createTmpFileWithContent({ testKey: 'testValue' }),
      );
      sut.set('testKey', 'newValue');
      expect(sut.get('testKey')).equal('newValue');
    });

    it('should persist the configuration file', () => {
      const pathToConfigFile = createTmpFileWithContent({
        testKey: 'testValue',
      });
      const sut = new JsonFileErnConfig(pathToConfigFile);
      sut.set('testKey', 'newValue');
      expect(
        JSON.parse(fs.readFileSync(pathToConfigFile).toString()),
      ).deep.equal({ testKey: 'newValue' });
    });
  });

  describe('del', () => {
    it('should delete the key', () => {
      const sut = new JsonFileErnConfig(
        createTmpFileWithContent({ testKey: 'testValue' }),
      );
      sut.del('testKey');
      expect(sut.get('testKey')).undefined;
    });

    it('should return false if the key does not exist', () => {
      const sut = new JsonFileErnConfig(getTmpConfigFilePath());
      expect(sut.del('testKey')).false;
    });

    it('should return true if the key was deleted', () => {
      const sut = new JsonFileErnConfig(
        createTmpFileWithContent({ testKey: 'testValue' }),
      );
      expect(sut.del('testKey')).true;
    });

    it('should persist the configuration file if the key was deleted', () => {
      const pathToConfigFile = createTmpFileWithContent({
        testKey: 'testValue',
      });
      const sut = new JsonFileErnConfig(pathToConfigFile);
      sut.del('testKey');
      expect(
        JSON.parse(fs.readFileSync(pathToConfigFile).toString()),
      ).deep.equal({});
    });
  });
});
