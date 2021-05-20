import { assert, expect } from 'chai';
import { rejects } from 'assert';
import sinon from 'sinon';
import * as utils from '../src/utils';
import { AppVersionDescriptor, PackagePath, yarn } from 'ern-core';
import { afterTest, beforeTest } from 'ern-util-dev';
import * as fixtures from './fixtures/common';
import { API, JS_API_IMPL, MINIAPP, NATIVE_API_IMPL } from '../src/ModuleTypes';
import log from '../src/log';
import * as git from '../src/gitCli';
import * as coreUtils from '../src/utils';

const sandbox = sinon.createSandbox();
let processExitStub: any;
let logStub: any;

const versionsArray = ['1.0.0', '2.0.0', '3.0.0', '4.0.0-canary.1'];

describe('utils.js', () => {
  beforeEach(() => {
    beforeTest();
    processExitStub = sandbox.stub(process, 'exit');
    logStub = sandbox.stub(log);
  });

  afterEach(() => {
    sandbox.restore();
    afterTest();
  });

  describe('isPublishedToNpm', () => {
    it('pkgName published in npm return true', async () => {
      const yarnStub = sinon.stub(yarn, 'info');
      yarnStub.resolves(versionsArray);
      expect(await utils.isPublishedToNpm(fixtures.pkgName)).to.eql(true);
      yarnStub.restore();
    });

    it('dependencyPath in npm return true', async () => {
      const yarnStub = sinon.stub(yarn, 'info');
      yarnStub.resolves(versionsArray);
      expect(
        await utils.isPublishedToNpm(new PackagePath(fixtures.pkgName)),
      ).to.eql(true);
      yarnStub.restore();
    });

    it('dependencyPath in npm with version return true', async () => {
      const yarnStub = sinon.stub(yarn, 'info');
      yarnStub.resolves(versionsArray);
      expect(await utils.isPublishedToNpm(new PackagePath('dep@1.0.0'))).to.eql(
        true,
      );
      yarnStub.restore();
    });

    it('dependencyPath in npm with invalid version return false', async () => {
      const yarnStub = sinon.stub(yarn, 'info');
      yarnStub.resolves(versionsArray);
      expect(
        await utils.isPublishedToNpm(new PackagePath('dep@1000.1000.0')),
      ).to.eql(false);
      yarnStub.restore();
    });

    it('pkgName not published in npm return false', async () => {
      const yarnStub = sinon.stub(yarn, 'info');
      yarnStub.rejects(new Error('Received invalid response from npm.'));
      expect(await utils.isPublishedToNpm('dep')).to.eql(false);
      yarnStub.restore();
    });
  });

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

  describe('isDependencyApiImpl', () => {
    it('return true if ern object resolves for native api impl', async () => {
      const yarnStub = sinon.stub(yarn, 'info');
      yarnStub.resolves({ moduleType: NATIVE_API_IMPL });
      expect(
        await utils.isDependencyApiImpl(PackagePath.fromString('dep')),
      ).to.eql(true);
      yarnStub.restore();
    });

    it('return true if ern object resolves for js api impl', async () => {
      const yarnStub = sinon.stub(yarn, 'info');
      yarnStub.resolves({ moduleType: JS_API_IMPL });
      expect(
        await utils.isDependencyApiImpl(PackagePath.fromString('dep')),
      ).to.eql(true);
      yarnStub.restore();
    });
  });

  describe('isDependencyApi', () => {
    it('returns true if ern module type is set to ern-api', async () => {
      const yarnStub = sinon.stub(yarn, 'info');
      yarnStub.resolves({ moduleType: API });
      expect(await utils.isDependencyApi(PackagePath.fromString('dep'))).to.eql(
        true,
      );
      yarnStub.restore();
    });
  });

  describe('isDependencyApiOrApiImpl', () => {
    it('return true if ern object resolves for api', async () => {
      const yarnStub = sinon.stub(yarn, 'info');
      yarnStub.resolves({ moduleType: API });
      expect(
        await utils.isDependencyApiOrApiImpl(PackagePath.fromString('dep')),
      ).to.eql(true);
      yarnStub.restore();
    });

    it('return true if ern object resolves for native api impl', async () => {
      const yarnStub = sinon.stub(yarn, 'info');
      yarnStub.resolves({ moduleType: NATIVE_API_IMPL });
      expect(
        await utils.isDependencyApiOrApiImpl(PackagePath.fromString('dep')),
      ).to.eql(true);
      yarnStub.restore();
    });

    it('return true if ern object resolves for js api impl', async () => {
      const yarnStub = sinon.stub(yarn, 'info');
      yarnStub.resolves({ moduleType: JS_API_IMPL });
      expect(
        await utils.isDependencyApiOrApiImpl(PackagePath.fromString('dep')),
      ).to.eql(true);
      yarnStub.restore();
    });
  });

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

  describe('logErrorAndExitProcess', () => {
    it('test logErrorAndExitProcess', () => {
      utils.logErrorAndExitProcess(new Error('test error'), 1);
      sinon.assert.calledOnce(logStub.error);
      sinon.assert.calledWith(logStub.error, 'An error occurred: test error');
      sinon.assert.calledOnce(processExitStub);
      sinon.assert.calledWith(processExitStub, 1);
    });

    it('test logErrorAndExitProcess with arguments', () => {
      utils.logErrorAndExitProcess(new Error('test error'), 1);
      sinon.assert.calledWith(logStub.error, 'An error occurred: test error');
      sinon.assert.calledWith(processExitStub, 1);
    });
  });

  describe('coerceToAppVersionDescriptor', () => {
    it('should coerce a string to a AppVersionDescriptor', () => {
      expect(utils.coerceToAppVersionDescriptor('test:android:1.0.0')).eql(
        AppVersionDescriptor.fromString('test:android:1.0.0'),
      );
    });

    it('should coerce an AppVersionDescriptor to a AppVersionDescriptor (noop)', () => {
      const descriptor = AppVersionDescriptor.fromString('test:android:1.0.0');
      expect(utils.coerceToAppVersionDescriptor(descriptor)).eql(descriptor);
    });
  });

  describe('coerceToAppVersionDescriptorArray', () => {
    it('should coerce a string to a AppVersionDescriptor array', () => {
      const descriptor = AppVersionDescriptor.fromString('test:android:1.0.0');
      const result =
        utils.coerceToAppVersionDescriptorArray('test:android:1.0.0');
      expect(result).is.an('array').of.length(1);
      expect(result[0]).eql(descriptor);
    });

    it('should coerce a AppVersionDescriptor to a AppVersionDescriptor array', () => {
      const descriptor = AppVersionDescriptor.fromString('test:android:1.0.0');
      const result = utils.coerceToAppVersionDescriptorArray(descriptor);
      expect(result).is.an('array').of.length(1);
      expect(result[0]).eql(descriptor);
    });

    it('should coerce a string|AppVersionDescriptor descriptor mixed array to a AppVersionDescriptor arry', () => {
      const descriptorA = AppVersionDescriptor.fromString('test:android:1.0.0');
      const descriptorB = AppVersionDescriptor.fromString('test:android:2.0.0');
      const result = utils.coerceToAppVersionDescriptorArray([
        'test:android:1.0.0',
        descriptorB,
      ]);
      expect(result).is.an('array').of.length(2);
      expect(result[0]).eql(descriptorA);
      expect(result[1]).eql(descriptorB);
    });
  });

  describe('coerceToPackagePath', () => {
    it('should coerce a string to a PackagePath', () => {
      expect(utils.coerceToPackagePath('dep@1.0.0')).eql(
        PackagePath.fromString('dep@1.0.0'),
      );
    });

    it('should coerce a PackagePath to a PackagePath (noop)', () => {
      const dep = PackagePath.fromString('dep@1.0.0');
      expect(utils.coerceToPackagePath(dep)).eql(dep);
    });
  });

  describe('coerceToPackagePathArray', () => {
    it('should coerce a string to a PackagePath array', () => {
      const dep = PackagePath.fromString('dep@1.0.0');
      const result = utils.coerceToPackagePathArray('dep@1.0.0');
      expect(result).is.an('array').of.length(1);
      expect(result[0]).eql(dep);
    });

    it('should coerce a PackagePath to a PackagePath array', () => {
      const dep = PackagePath.fromString('dep@1.0.0');
      const result = utils.coerceToPackagePathArray(dep);
      expect(result).is.an('array').of.length(1);
      expect(result[0]).eql(dep);
    });

    it('should coerce a string|PackagePath mixed array to a PackagePath array', () => {
      const depA = PackagePath.fromString('dep-a@1.0.0');
      const depB = PackagePath.fromString('dep-b@1.0.0');
      const result = utils.coerceToPackagePathArray(['dep-a@1.0.0', depB]);
      expect(result).is.an('array').of.length(2);
      expect(result[0]).eql(depA);
      expect(result[1]).eql(depB);
    });
  });

  describe('isGitBranch', () => {
    const sampleHeadsRefs = `
31d04959d8786113bfeaee997a1d1eaa8cb6c5f5        refs/heads/master
6319d9ef0c237907c784a8c472b000d5ff83b49a        refs/heads/v0.10
81ac6c5ef280e46a1d643f86f47c66b11aa1f8b4        refs/heads/v0.11`;

    it('should return false if the package path is not a git path', async () => {
      const result = await utils.isGitBranch(
        PackagePath.fromString('registry-package@1.2.3'),
      );
      expect(result).false;
    });

    it('should return true if the package path does not include a branch [as it corresponds to default branch]', async () => {
      const result = await utils.isGitBranch(
        PackagePath.fromString('https://github.com/org/repo.git'),
      );
      expect(result).true;
    });

    it('should return true if the branch exist', async () => {
      sandbox.stub(git, 'gitCli').returns({
        listRemote: async () => {
          return sampleHeadsRefs;
        },
      });
      const result = await utils.isGitBranch(
        PackagePath.fromString('https://github.com/org/repo.git#v0.10'),
      );
      expect(result).true;
    });

    it('should return false if the branch does not exist', async () => {
      sandbox.stub(git, 'gitCli').returns({
        listRemote: async () => {
          return sampleHeadsRefs;
        },
      });
      const result = await utils.isGitBranch(
        PackagePath.fromString('https://github.com/org/repo.git#foo'),
      );
      expect(result).false;
    });
  });

  describe('isGitTag', () => {
    const sampleTagsRefs = `
c4191b97e0f77f8cd128275977e7f284277131e0        refs/tags/v0.1.0
4cc7a6f041ebd9a7f4ec267cdc2e57cf0ddc61fa        refs/tags/v0.1.1
d9fa903349bbb9e7f86535cb69256e064d0fba65        refs/tags/v0.1.2`;

    it('should return false if the package path is not a git path', async () => {
      const result = await utils.isGitTag(
        PackagePath.fromString('registry-package@1.2.3'),
      );
      expect(result).false;
    });

    it('should return false if the package path does not include a tag', async () => {
      const result = await utils.isGitTag(
        PackagePath.fromString('https://github.com/org/repo.git'),
      );
      expect(result).false;
    });

    it('should return true if the tag exist', async () => {
      sandbox.stub(git, 'gitCli').returns({
        listRemote: async () => {
          return sampleTagsRefs;
        },
      });
      const result = await utils.isGitTag(
        PackagePath.fromString('https://github.com/org/repo.git#v0.1.2'),
      );
      expect(result).true;
    });

    it('should return false if the tag does not exist', async () => {
      sandbox.stub(git, 'gitCli').returns({
        listRemote: async () => {
          return sampleTagsRefs;
        },
      });
      const result = await utils.isGitBranch(
        PackagePath.fromString('https://github.com/org/repo.git#foo'),
      );
      expect(result).false;
    });
  });

  describe('getCommitShaOfGitBranchOrTag', () => {
    it('should throw if the package path is not a git path', async () => {
      await rejects(
        utils.getCommitShaOfGitBranchOrTag(PackagePath.fromString('dep@1.2.3')),
      );
    });

    it('should throw if the package path does not include a branch', async () => {
      await rejects(
        utils.getCommitShaOfGitBranchOrTag(
          PackagePath.fromString('https://github.com/org/repo.git'),
        ),
      );
    });

    it('should throw if the branch was not found', async () => {
      sandbox.stub(git, 'gitCli').returns({
        listRemote: async () => {
          return '';
        },
      });
      await rejects(
        utils.getCommitShaOfGitBranchOrTag(
          PackagePath.fromString('https://github.com/org/repo.git#foo'),
        ),
      );
    });

    it('should return the commit SHA of the branch HEAD', async () => {
      sandbox.stub(git, 'gitCli').returns({
        listRemote: async () => {
          return '31d04959d8786113bfeaee997a1d1eaa8cb6c5f5        refs/heads/master';
        },
      });
      const result = await utils.getCommitShaOfGitBranchOrTag(
        PackagePath.fromString('https://github.com/org/repo.git#master'),
      );
      expect(result).eql('31d04959d8786113bfeaee997a1d1eaa8cb6c5f5');
    });
  });
});
