import generateProject, { generatePackageJson } from '../src/generateProject';
import ernUtilDev from 'ern-util-dev';
import { expect } from 'chai';

describe('generateProject', function () {
  const { runBefore, runAfter, cwd } = ernUtilDev(__dirname);
  beforeEach(runBefore);
  afterEach(runAfter);

  it('should generate with options', async () => {
    await generateProject(
      {
        moduleName: 'hello',
        namespace: 'com.walmart.hello.ern',
        apiVersion: '1.1.0',
        apiDescription: 'Test',
        npmScope: 'walmart',
        apiAuthor: 'test',
        apiLicense: 'ISC',
        bridgeVersion: '1.0.0',
        reactNativeVersion: '14.0.5',
        apiSchemaPath: 'schema.json',
        artifactId: 'react-native-hello-api',
        targetDependencies: [],
      },
      cwd(),
    );
  });
});

describe('generatePackageJson', function () {
  it('generates a minimal package.json', () => {
    const result = JSON.parse(
      generatePackageJson({
        packageName: 'test',
        bridgeVersion: '1.2.3',
      }),
    );
    console.log(result);
    expect(result).to.deep.equal({
      name: 'test',
      version: '1.0.0',
      main: 'javascript/src/index.js',
      scripts: {
        flow: 'flow',
      },
      keywords: ['ern-api'],
      dependencies: {
        'react-native-electrode-bridge': '1.2.x',
      },
      devDependencies: {
        'flow-bin': '^0.47.0',
      },
      ern: {
        message: {
          apiSchemaPath: 'schema.json',
        },
        moduleType: 'ern-api',
      },
    });
  });

  it('generates a full package.json', () => {
    const result = JSON.parse(
      generatePackageJson({
        packageName: 'test',
        bridgeVersion: '1.2.3',
        reactNativeVersion: '2.3.3',
        apiLicense: 'ISC',
      }),
    );
    console.log(result);
    expect(result).to.deep.equal({
      name: 'test',
      version: '1.0.0',
      license: 'ISC',
      main: 'javascript/src/index.js',
      scripts: {
        flow: 'flow',
      },
      keywords: ['ern-api'],
      dependencies: {
        'react-native-electrode-bridge': '1.2.x',
      },
      devDependencies: {
        'flow-bin': '^0.47.0',
      },
      ern: {
        message: {
          apiSchemaPath: 'schema.json',
        },
        moduleType: 'ern-api',
      },
    });
  });
});
