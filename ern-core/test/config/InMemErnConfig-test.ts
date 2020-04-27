import { InMemErnConfig } from '../../src/config';
import { expect } from 'chai';

describe('InMemErnConfig', () => {
  describe('get', () => {
    it('should return the value associated to the given key', () => {
      const sut = new InMemErnConfig(
        {
          testKey: 'testValue',
        },
        '',
      );
      expect(sut.get('testKey')).equal('testValue');
    });

    it('should return undefined if the key does not exist and no defaultValue was provided', () => {
      const sut = new InMemErnConfig(undefined, '');
      expect(sut.get('testKey')).undefined;
    });

    it('should return the provided defaultValue if the key does not exist', () => {
      const sut = new InMemErnConfig(undefined, '');
      expect(sut.get('testKey', 'testDefaultValue')).equal('testDefaultValue');
    });
  });

  describe('set', () => {
    it('should create the key if it does not exist', () => {
      const sut = new InMemErnConfig(undefined, '');
      sut.set('testKey', 'testValue');
      expect(sut.get('testKey')).equal('testValue');
    });

    it('should overwrite previous value of key if key exist', () => {
      const sut = new InMemErnConfig(
        {
          testKey: 'testValue',
        },
        '',
      );
      sut.set('testKey', 'newValue');
      expect(sut.get('testKey')).equal('newValue');
    });
  });

  describe('del', () => {
    it('should delete the key', () => {
      const sut = new InMemErnConfig(
        {
          testKey: 'testValue',
        },
        '',
      );
      sut.del('testKey');
      expect(sut.get('testKey')).undefined;
    });

    it('should return false if the key does not exist', () => {
      const sut = new InMemErnConfig(undefined, '');
      expect(sut.del('testKey')).false;
    });

    it('should return true if the key was deleted', () => {
      const sut = new InMemErnConfig(
        {
          testKey: 'testValue',
        },
        '',
      );
      expect(sut.del('testKey')).true;
    });
  });

  it('should replace ${env.[ENV_VAR_KEY]} placeholders with matching env var value', () => {
    const sut = new InMemErnConfig(
      {
        keyA: '${env.TEST_ERN_ENV_VAR}',
        keyB: '${env.TEST_ERN_ENV_VAR}',
      },
      '',
    );
    const testValue = 'testValue';
    process.env.TEST_ERN_ENV_VAR = testValue;
    expect(sut.get('keyA')).eql(testValue);
    expect(sut.get('keyB')).eql(testValue);
  });

  it('should replace ${PWD} placeholders with current process working directory', () => {
    const cwd = process.cwd();
    const sut = new InMemErnConfig(
      {
        keyA: '${PWD}',
        keyB: '${PWD}',
      },
      '',
    );
    expect(sut.get('keyA')).eql(cwd);
    expect(sut.get('keyB')).eql(cwd);
  });

  it('should replace ${ERNRC} placeholders with resolved .ernrc directory', () => {
    const pathToErnRc = '/path/to/.ernrc';
    const sut = new InMemErnConfig(
      {
        keyA: '${ERNRC}',
        keyB: '${ERNRC}',
      },
      pathToErnRc,
    );
    expect(sut.get('keyA')).eql(pathToErnRc);
    expect(sut.get('keyB')).eql(pathToErnRc);
  });
});
