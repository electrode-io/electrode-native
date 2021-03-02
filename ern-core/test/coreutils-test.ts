import { expect } from 'chai';
import { yarn } from '../src/clients';
import sinon from 'sinon';
import * as utils from '../src/utils';
import { PackagePath } from '../src/PackagePath';
import { afterTest, beforeTest } from 'ern-util-dev';
import * as fixtures from './fixtures/common';
import { MINIAPP, API, JS_API_IMPL, NATIVE_API_IMPL } from '../src/ModuleTypes';
import path from 'path';

const sandbox = sinon.createSandbox();

// fixtures
// tslint:disable-next-line:no-var-requires
const yarnInfo = require('./fixtures/yarn_info.json');
// tslint:disable-next-line:no-var-requires
const yarnInfoErnApi = require('./fixtures/yarn_info_ern_api.json');
// tslint:disable-next-line:no-var-requires
const yarnInfoErnApiImpl = require('./fixtures/yarn_info_ern_api_impl.json');
// tslint:disable-next-line:no-var-requires
const yarnInfoErnJsApiImpl = require('./fixtures/yarn_info_ern_js_api_impl.json');
// tslint:disable-next-line:no-var-requires
const yarnInfoError = require('./fixtures/yarn_info_error.json');

// stub
let pathStub: any;

describe('utils.js', () => {
  beforeEach(() => {
    beforeTest();
    pathStub = sandbox.stub(path, 'join');
  });

  afterEach(() => {
    sandbox.restore();
    afterTest();
  });

  // ==========================================================
  // isPublishedToNpm
  // ==========================================================
  describe('isPublishedToNpm', () => {
    it('pkgName published in npm return true', async () => {
      const yarnStub = sinon.stub(yarn, 'info');
      yarnStub.resolves(yarnInfo);
      expect(await utils.isPublishedToNpm(fixtures.pkgName)).to.eql(true);
      yarnStub.restore();
    });

    it('dependencyPath in npm return true', async () => {
      const yarnStub = sinon.stub(yarn, 'info');
      yarnStub.resolves(yarnInfo);
      expect(
        await utils.isPublishedToNpm(new PackagePath(fixtures.pkgName)),
      ).to.eql(true);
      yarnStub.restore();
    });

    it('dependencyPath in npm with version return true', async () => {
      const yarnStub = sinon.stub(yarn, 'info');
      yarnStub.resolves(yarnInfo);
      expect(
        await utils.isPublishedToNpm(
          new PackagePath(fixtures.pkgNameWithVersion),
        ),
      ).to.eql(true);
      yarnStub.restore();
    });

    it('dependencyPath in npm with invalid version return false', async () => {
      const yarnStub = sinon.stub(yarn, 'info');
      yarnStub.resolves(yarnInfo);
      expect(
        await utils.isPublishedToNpm(
          new PackagePath(fixtures.pkgNameWithInvalidVersion),
        ),
      ).to.eql(false);
      yarnStub.restore();
    });

    it('pkgName not published in npm return false', async () => {
      const yarnStub = sinon.stub(yarn, 'info');
      yarnStub.rejects(new Error('Received invalid response from npm.'));
      expect(await utils.isPublishedToNpm(fixtures.pkgNameUnpublished)).to.eql(
        false,
      );
      yarnStub.restore();
    });
  });

  // ==========================================================
  // camelize
  // ==========================================================
  describe('camelize', () => {
    it('camelcase word with lowercaseFirstLetter true', () => {
      expect(utils.camelize('Foo Bar', true)).to.eql('fooBar');
      expect(utils.camelize('--foo-bar', true)).to.eql('fooBar');
      expect(utils.camelize('__foo_bar__', true)).to.eql('fooBar');
      expect(utils.camelize('fooBar', true)).to.eql('fooBar');
      expect(utils.camelize('foo-bar-bazz', true)).to.eql('fooBarBazz');
      expect(utils.camelize('GoBar', true)).to.eql('goBar');
    });

    it('camelcase word with lowercaseFirstLetter false', () => {
      expect(utils.camelize('')).to.eql('');
      expect(utils.camelize('Foo Bar')).to.eql('FooBar');
      expect(utils.camelize('--foo-bar')).to.eql('FooBar');
      expect(utils.camelize('__foo_bar__')).to.eql('FooBar');
      expect(utils.camelize('fooBar')).to.eql('FooBar');
      expect(utils.camelize('foo-bar-bazz')).to.eql('FooBarBazz');
      expect(utils.camelize('GoBar')).to.eql('GoBar');
    });
  });

  // ==========================================================
  // splitCamelCaseString
  // ==========================================================
  describe('splitCamelCaseString', () => {
    it('split camel case string', () => {
      expect(utils.splitCamelCaseString('')).to.eql(['']);
      expect(utils.splitCamelCaseString('fooBar')).to.eql(['foo', 'bar']);
      expect(utils.splitCamelCaseString('FooBarBazz')).to.eql([
        'foo',
        'bar',
        'bazz',
      ]);
      expect(utils.splitCamelCaseString('foobar')).to.eql(['foobar']);
    });
  });

  // ==========================================================
  // getDefaultPackageNameForCamelCaseString
  // ==========================================================
  describe('getDefaultPackageNameForCamelCaseString', () => {
    it('get default package name no module type', () => {
      const tests = [
        { name: 'foobar', expected: 'foobar' },
        { name: 'fooBar', expected: 'foo-bar' },
        { name: 'FooBar', expected: 'foo-bar' },
        { name: 'Foobar', expected: 'foobar' },
      ];
      tests.forEach(({ name, expected }) => {
        expect(utils.getDefaultPackageNameForCamelCaseString(name)).to.eql(
          expected,
        );
      });
    });

    it('get default package name for MINIAPP module type', () => {
      const tests = [
        { name: 'foobar', expected: 'foobar' },
        { name: 'fooBar', expected: 'foo-bar' },
        { name: 'FooBar', expected: 'foo-bar' },
        { name: 'Foobar', expected: 'foobar' },
        { name: 'FoobarMini', expected: 'foobar' },
        { name: 'FoobarMiniApp', expected: 'foobar' },
        { name: 'miniFoobarApp', expected: 'foobar' },
      ];
      tests.forEach(({ name, expected }) => {
        expect(
          utils.getDefaultPackageNameForCamelCaseString(name, MINIAPP),
        ).to.eql(expected);
      });
    });

    it('get default package name for API module type', () => {
      const tests = [
        { name: 'foobar', expected: 'foobar' },
        { name: 'fooBar', expected: 'foo-bar' },
        { name: 'FooBar', expected: 'foo-bar' },
        { name: 'Foobar', expected: 'foobar' },
        { name: 'FoobarApi', expected: 'foobar' },
        { name: 'apiFoobar', expected: 'foobar' },
        { name: 'ApiFoobar', expected: 'foobar' },
      ];
      tests.forEach(({ name, expected }) => {
        expect(utils.getDefaultPackageNameForCamelCaseString(name, API)).to.eql(
          expected,
        );
      });
    });

    it('get default package name for JS_API_IMPL module type', () => {
      const tests = [
        { name: 'foobar', expected: 'foobar' },
        { name: 'fooBar', expected: 'foo-bar' },
        { name: 'FooBar', expected: 'foo-bar' },
        { name: 'implFoobar', expected: 'foobar' },
        { name: 'FoobarApi', expected: 'foobar' },
        { name: 'apiFoobarImpl', expected: 'foobar' },
        { name: 'ImplApiFoobar', expected: 'foobar' },
      ];
      tests.forEach(({ name, expected }) => {
        expect(
          utils.getDefaultPackageNameForCamelCaseString(name, JS_API_IMPL),
        ).to.eql(expected);
      });
    });

    it('get default package name for NATIVE_API_IMPL module type', () => {
      const tests = [
        { name: 'foobar', expected: 'foobar' },
        { name: 'fooBar', expected: 'foo-bar' },
        { name: 'FooBar', expected: 'foo-bar' },
        { name: 'implFoobar', expected: 'foobar' },
        { name: 'FoobarApi', expected: 'foobar' },
        { name: 'apiFoobarImpl', expected: 'foobar' },
        { name: 'ImplApiFoobar', expected: 'foobar' },
      ];
      tests.forEach(({ name, expected }) => {
        expect(
          utils.getDefaultPackageNameForCamelCaseString(name, NATIVE_API_IMPL),
        ).to.eql(expected);
      });
    });
  });

  // ==========================================================
  // getModuleSuffix
  // ==========================================================
  describe('getModuleSuffix', () => {
    it('returns the correct suffixes', () => {
      expect(utils.getModuleSuffix(MINIAPP)).to.eql('miniapp');
      expect(utils.getModuleSuffix(API)).to.eql('api');
      expect(utils.getModuleSuffix(JS_API_IMPL)).to.eql('api-impl-js');
      expect(utils.getModuleSuffix(NATIVE_API_IMPL)).to.eql('api-impl-native');
    });

    it('throws exception for unsupported module type', () => {
      try {
        utils.getModuleSuffix('unsupported');
      } catch (e) {
        expect(e.message).to.eql(`Unsupported module type : unsupported`);
      }
    });
  });

  // ==========================================================
  // getDefaultPackageNameForModule
  // ==========================================================
  describe('getDefaultPackageNameForModule', () => {
    const tests = {
      api: [
        { name: 'foobar', expected: 'foobar-api' },
        { name: 'fooBar', expected: 'foo-bar-api' },
        { name: 'FooBar', expected: 'foo-bar-api' },
        { name: 'Foobar', expected: 'foobar-api' },
        { name: 'FoobarApi', expected: 'foobar-api' },
        { name: 'apiFoobar', expected: 'foobar-api' },
        { name: 'ApiFoobar', expected: 'foobar-api' },
      ],
      jsApiImpl: [
        { name: 'foobar', expected: 'foobar-api-impl-js' },
        { name: 'fooBar', expected: 'foo-bar-api-impl-js' },
        { name: 'FooBar', expected: 'foo-bar-api-impl-js' },
        { name: 'Foobar', expected: 'foobar-api-impl-js' },
        { name: 'FoobarApi', expected: 'foobar-api-impl-js' },
        { name: 'apiFoobar', expected: 'foobar-api-impl-js' },
        { name: 'ApiFoobar', expected: 'foobar-api-impl-js' },
      ],
      miniapp: [
        { name: 'foobar', expected: 'foobar-miniapp' },
        { name: 'fooBar', expected: 'foo-bar-miniapp' },
        { name: 'FooBar', expected: 'foo-bar-miniapp' },
        { name: 'Foobar', expected: 'foobar-miniapp' },
        { name: 'FoobarMini', expected: 'foobar-miniapp' },
        { name: 'FoobarMiniApp', expected: 'foobar-miniapp' },
        { name: 'miniFoobarApp', expected: 'foobar-miniapp' },
      ],
      nativeApiImpl: [
        { name: 'foobar', expected: 'foobar-api-impl-native' },
        { name: 'fooBar', expected: 'foo-bar-api-impl-native' },
        { name: 'FooBar', expected: 'foo-bar-api-impl-native' },
        { name: 'Foobar', expected: 'foobar-api-impl-native' },
        { name: 'FoobarApi', expected: 'foobar-api-impl-native' },
        { name: 'apiFoobar', expected: 'foobar-api-impl-native' },
        { name: 'ApiFoobar', expected: 'foobar-api-impl-native' },
      ],
    };

    it('get default package name API', () => {
      tests.api.forEach(({ name, expected }) => {
        expect(utils.getDefaultPackageNameForModule(name, API)).to.eql(
          expected,
        );
      });
    });

    it('get default package name JS_API_IMPL', () => {
      tests.jsApiImpl.forEach(({ name, expected }) => {
        expect(utils.getDefaultPackageNameForModule(name, JS_API_IMPL)).to.eql(
          expected,
        );
      });
    });

    it('get default package name MINIAPP', () => {
      tests.miniapp.forEach(({ name, expected }) => {
        expect(utils.getDefaultPackageNameForModule(name, MINIAPP)).to.eql(
          expected,
        );
      });
    });

    it('get default package name NATIVE_API_IMPL', () => {
      tests.nativeApiImpl.forEach(({ name, expected }) => {
        expect(
          utils.getDefaultPackageNameForModule(name, NATIVE_API_IMPL),
        ).to.eql(expected);
      });
    });

    it('throws exception for unsupported module type', () => {
      try {
        utils.getDefaultPackageNameForModule('foobar', 'unsupported');
      } catch (e) {
        expect(e.message).to.eql('Unsupported module type : unsupported');
      }
    });
  });

  // ==========================================================
  // isDependencyApiImpl
  // ==========================================================
  describe('isDependencyApiImpl', () => {
    it('return true if regex matches', async () => {
      expect(
        await utils.isDependencyApiImpl(
          PackagePath.fromString('react-native-header-api-impl'),
        ),
      ).to.eql(true);
    });

    it('return true if ern object resolves for native api impl', async () => {
      const yarnStub = sinon.stub(yarn, 'info');
      yarnStub.resolves(yarnInfoErnApiImpl);
      expect(
        await utils.isDependencyApiImpl(PackagePath.fromString('react-header')),
      ).to.eql(true);
      yarnStub.restore();
    });

    it('return true if ern object resolves for js api impl', async () => {
      const yarnStub = sinon.stub(yarn, 'info');
      yarnStub.resolves(yarnInfoErnJsApiImpl);
      expect(
        await utils.isDependencyApiImpl(PackagePath.fromString('react-header')),
      ).to.eql(true);
      yarnStub.restore();
    });
  });

  // ==========================================================
  // isDependencyApi
  // ==========================================================
  describe('isDependencyApi', () => {
    it('return true if regex matches', async () => {
      expect(
        await utils.isDependencyApi(
          PackagePath.fromString('react-native-header-api'),
        ),
      ).to.eql(true);
    });

    it('return true if ern object resolves for api', async () => {
      const yarnStub = sinon.stub(yarn, 'info');
      yarnStub.resolves(yarnInfoErnApi);
      expect(
        await utils.isDependencyApi(PackagePath.fromString('react-header')),
      ).to.eql(true);
      yarnStub.restore();
    });
  });

  // ==========================================================
  // isDependencyApiOrApiImpl
  // ==========================================================
  describe('isDependencyApiOrApiImpl', () => {
    it('return true if regex matches', async () => {
      expect(
        await utils.isDependencyApiOrApiImpl(
          PackagePath.fromString('react-native-header-api'),
        ),
      ).to.eql(true);
    });

    it('return true if ern object resolves for api', async () => {
      const yarnStub = sinon.stub(yarn, 'info');
      yarnStub.resolves(yarnInfoErnApi);
      expect(
        await utils.isDependencyApiOrApiImpl(
          PackagePath.fromString('react-header'),
        ),
      ).to.eql(true);
      yarnStub.restore();
    });

    it('return true if regex matches', async () => {
      const yarnStub = sinon.stub(yarn, 'info');
      yarnStub.resolves(yarnInfoErnApi);
      expect(
        await utils.isDependencyApiOrApiImpl(
          PackagePath.fromString('react-native-header-api-impl'),
        ),
      ).to.eql(true);
      yarnStub.restore();
    });

    it('return true if ern object resolves for native api impl', async () => {
      const yarnStub = sinon.stub(yarn, 'info');
      yarnStub.resolves(yarnInfoErnApiImpl);
      expect(
        await utils.isDependencyApiOrApiImpl(
          PackagePath.fromString('react-header'),
        ),
      ).to.eql(true);
      yarnStub.restore();
    });

    it('return true if ern object resolves for js api impl', async () => {
      const yarnStub = sinon.stub(yarn, 'info');
      yarnStub.resolves(yarnInfoErnJsApiImpl);
      expect(
        await utils.isDependencyApiOrApiImpl(
          PackagePath.fromString('react-header'),
        ),
      ).to.eql(true);
      yarnStub.restore();
    });
  });

  // ==========================================================
  // isValidElectrodeNativeModuleName
  // ==========================================================
  describe('isValidElectrodeNativeModuleName', () => {
    fixtures.validElectrodeNativeModuleNames.forEach((name) => {
      it('should return true if valid electrode native module name', () => {
        expect(utils.isValidElectrodeNativeModuleName(name)).to.eql(true);
      });
    });

    fixtures.invalidElectrodeNativeModuleNames.forEach((name) => {
      it('should return false if valid electrode native module name', () => {
        expect(utils.isValidElectrodeNativeModuleName(name)).to.eql(false);
      });
    });
  });

  // ==========================================================
  // getDownloadedPluginPath
  // ==========================================================
  describe('getDownloadedPluginPath', () => {
    it('return download plugin path for npm plugin', () => {
      const pluginPath = 'node_modules/react-native-code-push';
      const npmPlugin = {
        name: 'react-native-code-push',
        type: 'npm',
        version: '1.16.1-beta',
      };
      pathStub.returns(pluginPath);
      expect(utils.getDownloadedPluginPath(npmPlugin)).to.eql(pluginPath);
    });

    it('return download plugin path for npm plugin', () => {
      const pluginPath = 'node_modules/@msft/react-native-code-push';
      const npmPluginWithScope = {
        name: '@msft/react-native-code-push',
        type: 'npm',
        version: '1.16.1-beta',
      };
      pathStub.returns(pluginPath);
      expect(utils.getDownloadedPluginPath(npmPluginWithScope)).to.eql(
        pluginPath,
      );
    });

    it('return download plugin path for git plugin', () => {
      const pluginPath =
        'https://github.com/aoriani/ReactNative-StackTracer.git';
      const gitPlugin = {
        type: 'git',
        url: 'https://github.com/aoriani/ReactNative-StackTracer.git',
        version: '0.1.1',
      };
      pathStub.returns(pluginPath);
      expect(utils.getDownloadedPluginPath(gitPlugin)).to.eql(
        'ReactNative-StackTracer',
      );
    });

    it('throw error if plugin path cannot be resolved', () => {
      const unknown = {
        type: 'unknown',
        url: 'https://github.com/aoriani/ReactNative-StackTracer.git',
        version: '0.1.1',
      };
      try {
        utils.getDownloadedPluginPath(unknown);
      } catch (e) {
        expect(e.message).to.include('Unsupported plugin origin type');
      }
    });
  });
});
