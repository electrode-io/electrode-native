import normalizeConfig from '../src/normalizeConfig';
import { expect } from 'chai';

describe('normalizeConfig', function () {
  it('creates keys based on config input', () => {
    const result = normalizeConfig({
      npmScope: 'walmart',
      name: 'hello',
      reactNativeVersion: '14.0.5',
      apiVersion: '1.1.0',
      apiDescription: 'Test',
      apiAuthor: 'test',
      bridgeVersion: '1.0.0',
      packageName: '',
      targetDependencies: [],
    });
    expect(result).to.deep.equal({
      moduleName: 'hello',
      namespace: 'com.walmart.hello.ern',
      apiVersion: '1.1.0',
      apiDescription: 'Test',
      npmScope: 'walmart',
      apiAuthor: 'test',
      bridgeVersion: '1.0.0',
      reactNativeVersion: '14.0.5',
      apiSchemaPath: 'schema.json',
      artifactId: 'react-native-hello-api',
      targetDependencies: [],
    });
    console.log(result);
  });

  it('generates a minimal config', () => {
    const result = normalizeConfig({
      name: 'hello',
      bridgeVersion: '1.0.0',
      reactNativeVersion: '14.0.5',
    });
    console.log(result);
    expect(result).to.include.any.keys('apiVersion');
  });
});
