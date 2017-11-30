// @flow

import {
  assert,
  expect
} from 'chai'
import { yarn } from '../src/clients'
import sinon from 'sinon'
import * as utils from '../src/utils'
import {
  DependencyPath,
} from 'ern-util'
import {
  beforeTest,
  afterTest,
  stubs
} from 'ern-util-dev'
import * as fixtures from './fixtures/common'
import * as ModuleTypes from '../src/ModuleTypes'
import path from 'path'

// fixtures
const yarnInfo = require('./fixtures/yarn_info.json')
const yarnInfoErnApi = require('./fixtures/yarn_info_ern_api.json')
const yarnInfoErnApiImpl = require('./fixtures/yarn_info_ern_api_impl.json')
const yarnInfoErnJsApiImpl = require('./fixtures/yarn_info_ern_js_api_impl.json')
const yarnInfoError = require('./fixtures/yarn_info_error.json')

// stub
let pathStub

describe('utils.js', () => {
  beforeEach(() => {
    beforeTest()
    pathStub = sinon.stub(path, 'join')
  })
  
  afterEach(() => {
    pathStub.restore()
    afterTest()
  })

  // ==========================================================
  // isPublishedToNpm
  // ==========================================================
  describe('isPublishedToNpm', () => {
    it('pkgName published in npm return true', async () => {
      const yarnStub = sinon.stub(yarn, 'info')
      yarnStub.resolves(yarnInfo)
      expect(await utils.isPublishedToNpm(fixtures.pkgName)).to.eql(true)
      yarnStub.restore()
    })

    it('dependencyPath in npm return true', async () => {
      const yarnStub = sinon.stub(yarn, 'info')
      yarnStub.resolves(yarnInfo)
      expect(await utils.isPublishedToNpm(new DependencyPath(fixtures.pkgName))).to.eql(true)
      yarnStub.restore()
    })

    it('dependencyPath in npm with version return true', async () => {
      const yarnStub = sinon.stub(yarn, 'info')
      yarnStub.resolves(yarnInfo)
      expect(await utils.isPublishedToNpm(new DependencyPath(fixtures.pkgNameWithVersion))).to.eql(true)
      yarnStub.restore()
    })

    it('dependencyPath in npm with invalid version return false', async () => {
      const yarnStub = sinon.stub(yarn, 'info')
      yarnStub.resolves(yarnInfo)
      expect(await utils.isPublishedToNpm(new DependencyPath(fixtures.pkgNameWithInvalidVersion))).to.eql(false)
      yarnStub.restore()
    })

    it('pkgName not published in npm return false', async () => {
      const yarnStub = sinon.stub(yarn, 'info')
      yarnStub.resolves(yarnInfoError)
      expect(await utils.isPublishedToNpm(fixtures.pkgNameNotInNpm)).to.eql(false)
      yarnStub.restore()
    })

    it('yarn info returns error return false', async () => {
      const yarnStub = sinon.stub(yarn, 'info')
      yarnStub.resolves(new Error('fake error'))
      expect(await utils.isPublishedToNpm(fixtures.pkgNameNotInNpm)).to.eql(false)
      yarnStub.restore()
    })
  })

  // ==========================================================
  // camelize
  // ==========================================================
  describe('camelize', () => {
    it('camelcase word with lowercaseFirstLetter true', () => {
      expect(utils.camelize('Foo Bar', true)).to.eql('fooBar')
      expect(utils.camelize('--foo-bar', true)).to.eql('fooBar')
      expect(utils.camelize('__foo_bar__', true)).to.eql('fooBar')
      expect(utils.camelize('fooBar', true)).to.eql('fooBar')
      expect(utils.camelize('foo-bar-bazz', true)).to.eql('fooBarBazz')
      expect(utils.camelize('GoBar', true)).to.eql('goBar')
    })

    it('camelcase word with lowercaseFirstLetter false', () => {
      expect(utils.camelize('')).to.eql('')
      expect(utils.camelize('Foo Bar')).to.eql('FooBar')
      expect(utils.camelize('--foo-bar')).to.eql('FooBar')
      expect(utils.camelize('__foo_bar__')).to.eql('FooBar')
      expect(utils.camelize('fooBar')).to.eql('FooBar')
      expect(utils.camelize('foo-bar-bazz')).to.eql('FooBarBazz')
      expect(utils.camelize('GoBar')).to.eql('GoBar')
    })
  })

  // ==========================================================
  // splitCamelCaseString
  // ==========================================================
  describe('splitCamelCaseString', () => {
    it('split camel case string', () => {
      expect(utils.splitCamelCaseString('')).to.eql([''])
      expect(utils.splitCamelCaseString('fooBar')).to.eql(['foo', 'bar'])
      expect(utils.splitCamelCaseString('FooBarBazz')).to.eql(['foo', 'bar', 'bazz'])
      expect(utils.splitCamelCaseString('foobar')).to.eql(['foobar'])
    })
  })

  // ==========================================================
  // getDefaultPackageNameForCamelCaseString
  // ==========================================================
  describe('getDefaultPackageNameForCamelCaseString', () => {
    it('get default package name no module type', () => {
      expect(utils.getDefaultPackageNameForCamelCaseString('foobar')).to.eql('foobar')
      expect(utils.getDefaultPackageNameForCamelCaseString('fooBar')).to.eql('foo-bar')
      expect(utils.getDefaultPackageNameForCamelCaseString('FooBar')).to.eql('foo-bar')
      expect(utils.getDefaultPackageNameForCamelCaseString('Foobar')).to.eql('foobar')
    })

    it('get default package name for MINIAPP module type', () => {
      expect(
        utils.getDefaultPackageNameForCamelCaseString('foobar', ModuleTypes.MINIAPP)
      ).to.eql('foobar')
      expect(
        utils.getDefaultPackageNameForCamelCaseString('fooBar', ModuleTypes.MINIAPP)
      ).to.eql('foo-bar')
      expect(
        utils.getDefaultPackageNameForCamelCaseString('FooBar', ModuleTypes.MINIAPP)
      ).to.eql('foo-bar')
      expect(
        utils.getDefaultPackageNameForCamelCaseString('Foobar', ModuleTypes.MINIAPP)
      ).to.eql('foobar')
      expect(
        utils.getDefaultPackageNameForCamelCaseString('FoobarMini', ModuleTypes.MINIAPP)
      ).to.eql('foobar')
      expect(
        utils.getDefaultPackageNameForCamelCaseString('FoobarMiniApp', ModuleTypes.MINIAPP)
      ).to.eql('foobar')
      expect(
        utils.getDefaultPackageNameForCamelCaseString('miniFoobarApp', ModuleTypes.MINIAPP)
      ).to.eql('foobar')
    })

    it('get default package name for API module type', () => {
      expect(
        utils.getDefaultPackageNameForCamelCaseString('foobar', ModuleTypes.API)
      ).to.eql('foobar')
      expect(
        utils.getDefaultPackageNameForCamelCaseString('fooBar', ModuleTypes.API)
      ).to.eql('foo-bar')
      expect(
        utils.getDefaultPackageNameForCamelCaseString('FooBar', ModuleTypes.API)
      ).to.eql('foo-bar')
      expect(
        utils.getDefaultPackageNameForCamelCaseString('Foobar', ModuleTypes.API)
      ).to.eql('foobar')
      expect(
        utils.getDefaultPackageNameForCamelCaseString('FoobarApi', ModuleTypes.API)
      ).to.eql('foobar')
      expect(
        utils.getDefaultPackageNameForCamelCaseString('apiFoobar', ModuleTypes.API)
      ).to.eql('foobar')
      expect(
        utils.getDefaultPackageNameForCamelCaseString('ApiFoobar', ModuleTypes.API)
      ).to.eql('foobar')
    })

    it('get default package name for JS_API_IMPL module type', () => {
      expect(
        utils.getDefaultPackageNameForCamelCaseString('foobar', ModuleTypes.JS_API_IMPL)
      ).to.eql('foobar')
      expect(
        utils.getDefaultPackageNameForCamelCaseString('fooBar', ModuleTypes.JS_API_IMPL)
      ).to.eql('foo-bar')
      expect(
        utils.getDefaultPackageNameForCamelCaseString('FooBar', ModuleTypes.JS_API_IMPL)
      ).to.eql('foo-bar')
      expect(
        utils.getDefaultPackageNameForCamelCaseString('implFoobar', ModuleTypes.JS_API_IMPL)
      ).to.eql('foobar')
      expect(
        utils.getDefaultPackageNameForCamelCaseString('FoobarApi', ModuleTypes.JS_API_IMPL)
      ).to.eql('foobar')
      expect(
        utils.getDefaultPackageNameForCamelCaseString('apiFoobarImpl', ModuleTypes.JS_API_IMPL)
      ).to.eql('foobar')
      expect(
        utils.getDefaultPackageNameForCamelCaseString('ImplApiFoobar', ModuleTypes.JS_API_IMPL)
      ).to.eql('foobar')
    })

    it('get default package name for NATIVE_API_IMPL module type', () => {
      expect(
        utils.getDefaultPackageNameForCamelCaseString('foobar', ModuleTypes.NATIVE_API_IMPL)
      ).to.eql('foobar')
      expect(
        utils.getDefaultPackageNameForCamelCaseString('fooBar', ModuleTypes.NATIVE_API_IMPL)
      ).to.eql('foo-bar')
      expect(
        utils.getDefaultPackageNameForCamelCaseString('FooBar', ModuleTypes.NATIVE_API_IMPL)
      ).to.eql('foo-bar')
      expect(
        utils.getDefaultPackageNameForCamelCaseString('implFoobar', ModuleTypes.NATIVE_API_IMPL)
      ).to.eql('foobar')
      expect(
        utils.getDefaultPackageNameForCamelCaseString('FoobarApi', ModuleTypes.NATIVE_API_IMPL)
      ).to.eql('foobar')
      expect(
        utils.getDefaultPackageNameForCamelCaseString('apiFoobarImpl', ModuleTypes.NATIVE_API_IMPL)
      ).to.eql('foobar')
      expect(
        utils.getDefaultPackageNameForCamelCaseString('ImplApiFoobar', ModuleTypes.NATIVE_API_IMPL)
      ).to.eql('foobar')
    })
  })

  // ==========================================================
  // getDefaultPackageNameForModule
  // ==========================================================
  describe('getDefaultPackageNameForModule', () => {
    it('get default package name MINIAPP', () => {
      expect(
        utils.getDefaultPackageNameForModule('foobar', ModuleTypes.MINIAPP)
      ).to.eql('foobar-miniapp')
      expect(
        utils.getDefaultPackageNameForModule('fooBar', ModuleTypes.MINIAPP)
      ).to.eql('foo-bar-miniapp')
      expect(
        utils.getDefaultPackageNameForModule('FooBar', ModuleTypes.MINIAPP)
      ).to.eql('foo-bar-miniapp')
      expect(
        utils.getDefaultPackageNameForModule('Foobar', ModuleTypes.MINIAPP)
      ).to.eql('foobar-miniapp')
      expect(
        utils.getDefaultPackageNameForModule('FoobarMini', ModuleTypes.MINIAPP)
      ).to.eql('foobar-miniapp')
      expect(
        utils.getDefaultPackageNameForModule('FoobarMiniApp', ModuleTypes.MINIAPP)
      ).to.eql('foobar-miniapp')
      expect(
        utils.getDefaultPackageNameForModule('miniFoobarApp', ModuleTypes.MINIAPP)
      ).to.eql('foobar-miniapp')
    })

    it('get default package name API', () => {
      expect(
        utils.getDefaultPackageNameForModule('foobar', ModuleTypes.API)
      ).to.eql('foobar-api')
      expect(
        utils.getDefaultPackageNameForModule('fooBar', ModuleTypes.API)
      ).to.eql('foo-bar-api')
      expect(
        utils.getDefaultPackageNameForModule('FooBar', ModuleTypes.API)
      ).to.eql('foo-bar-api')
      expect(
        utils.getDefaultPackageNameForModule('Foobar', ModuleTypes.API)
      ).to.eql('foobar-api')
      expect(
        utils.getDefaultPackageNameForModule('FoobarApi', ModuleTypes.API)
      ).to.eql('foobar-api')
      expect(
        utils.getDefaultPackageNameForModule('apiFoobar', ModuleTypes.API)
      ).to.eql('foobar-api')
      expect(
        utils.getDefaultPackageNameForModule('ApiFoobar', ModuleTypes.API)
      ).to.eql('foobar-api')
    })

    it('get default package name JS_API_IMPL', () => {
      expect(
        utils.getDefaultPackageNameForModule('foobar', ModuleTypes.JS_API_IMPL)
      ).to.eql('foobar-api-impl-js')
      expect(
        utils.getDefaultPackageNameForModule('fooBar', ModuleTypes.JS_API_IMPL)
      ).to.eql('foo-bar-api-impl-js')
      expect(
        utils.getDefaultPackageNameForModule('FooBar', ModuleTypes.JS_API_IMPL)
      ).to.eql('foo-bar-api-impl-js')
      expect(
        utils.getDefaultPackageNameForModule('implFoobar', ModuleTypes.JS_API_IMPL)
      ).to.eql('foobar-api-impl-js')
      expect(
        utils.getDefaultPackageNameForModule('FoobarApi', ModuleTypes.JS_API_IMPL)
      ).to.eql('foobar-api-impl-js')
      expect(
        utils.getDefaultPackageNameForModule('apiFoobarImpl', ModuleTypes.JS_API_IMPL)
      ).to.eql('foobar-api-impl-js')
      expect(
        utils.getDefaultPackageNameForModule('ImplApiFoobar', ModuleTypes.JS_API_IMPL)
      ).to.eql('foobar-api-impl-js')
    })

    it('get default package name NATIVE_API_IMPL', () => {
      expect(
        utils.getDefaultPackageNameForModule('foobar', ModuleTypes.NATIVE_API_IMPL)
      ).to.eql('foobar-api-impl-native')
      expect(
        utils.getDefaultPackageNameForModule('fooBar', ModuleTypes.NATIVE_API_IMPL)
      ).to.eql('foo-bar-api-impl-native')
      expect(
        utils.getDefaultPackageNameForModule('FooBar', ModuleTypes.NATIVE_API_IMPL)
      ).to.eql('foo-bar-api-impl-native')
      expect(
        utils.getDefaultPackageNameForModule('implFoobar', ModuleTypes.NATIVE_API_IMPL)
      ).to.eql('foobar-api-impl-native')
      expect(
        utils.getDefaultPackageNameForModule('FoobarApi', ModuleTypes.NATIVE_API_IMPL)
      ).to.eql('foobar-api-impl-native')
      expect(
        utils.getDefaultPackageNameForModule('apiFoobarImpl', ModuleTypes.NATIVE_API_IMPL)
      ).to.eql('foobar-api-impl-native')
      expect(
        utils.getDefaultPackageNameForModule('ImplApiFoobar', ModuleTypes.NATIVE_API_IMPL)
      ).to.eql('foobar-api-impl-native')

    })

    it('get default package name NATIVE_API_IMPL', () => {
      try {
        utils.getDefaultPackageNameForModule('foobar', fixtures.moduleTypeNotSupported)
      } catch (e) {
        expect(e.message).to.eql('Unsupported module type : moduleTypeNotSupported')
      }
    })
  })

  // ==========================================================
  // isDependencyApiImpl
  // ==========================================================
  describe('isDependencyApiImpl', () => {
    it('return true if regex matches', async () => {
      expect(await utils.isDependencyApiImpl('react-native-header-api-impl')).to.eql(true)
    })

    it('return true if ern object resolves for native api impl', async () => {
      const yarnStub = sinon.stub(yarn, 'info')
      yarnStub.resolves(yarnInfoErnApiImpl)
      expect(await utils.isDependencyApiImpl('react-header')).to.eql(true)
      yarnStub.restore()
    })

    it('return true if ern object resolves for js api impl', async () => {
      const yarnStub = sinon.stub(yarn, 'info')
      yarnStub.resolves(yarnInfoErnJsApiImpl)
      expect(await utils.isDependencyApiImpl('react-header')).to.eql(true)
      yarnStub.restore()
    })

    it('return false if yarn info error', async () => {
      const yarnStub = sinon.stub(yarn, 'info')
      yarnStub.resolves(yarnInfoError)
      expect(await utils.isDependencyApiImpl('react-header')).to.eql(false)
      yarnStub.restore()
    })
  })

  // ==========================================================
  // isDependencyApi
  // ==========================================================
  describe('isDependencyApi', () => {
    it('return true if regex matches', async () => {
      expect(await utils.isDependencyApi('react-native-header-api')).to.eql(true)
    })

    it('return true if ern object resolves for api', async () => {
      const yarnStub = sinon.stub(yarn, 'info')
      yarnStub.resolves(yarnInfoErnApi)
      expect(await utils.isDependencyApi('react-header')).to.eql(true)
      yarnStub.restore()
    })

    it('return false if yarn info error', async () => {
      const yarnStub = sinon.stub(yarn, 'info')
      yarnStub.resolves(yarnInfoError)
      expect(await utils.isDependencyApi('react-header')).to.eql(false)
      yarnStub.restore()
    })
  })

  // ==========================================================
  // isDependencyApiOrApiImpl
  // ==========================================================
  describe('isDependencyApiOrApiImpl', () => {
    it('return true if regex matches', async () => {
      expect(await utils.isDependencyApiOrApiImpl('react-native-header-api')).to.eql(true)
    })

    it('return true if ern object resolves for api', async () => {
      const yarnStub = sinon.stub(yarn, 'info')
      yarnStub.resolves(yarnInfoErnApi)
      expect(await utils.isDependencyApiOrApiImpl('react-header')).to.eql(true)
      yarnStub.restore()
    })

    it('return false if yarn info error', async () => {
      const yarnStub = sinon.stub(yarn, 'info')
      yarnStub.resolves(yarnInfoError)
      expect(await utils.isDependencyApiOrApiImpl('react-header')).to.eql(false)
      yarnStub.restore()
    })

    it('return true if regex matches', async () => {
      const yarnStub = sinon.stub(yarn, 'info')
      yarnStub.resolves(yarnInfoErnApi)
      expect(await utils.isDependencyApiOrApiImpl('react-native-header-api-impl')).to.eql(true)
      yarnStub.restore()
    })

    it('return true if ern object resolves for native api impl', async () => {
      const yarnStub = sinon.stub(yarn, 'info')
      yarnStub.resolves(yarnInfoErnApiImpl)
      expect(await utils.isDependencyApiOrApiImpl('react-header')).to.eql(true)
      yarnStub.restore()
    })

    it('return true if ern object resolves for js api impl', async () => {
      const yarnStub = sinon.stub(yarn, 'info')
      yarnStub.resolves(yarnInfoErnJsApiImpl)
      expect(await utils.isDependencyApiOrApiImpl('react-header')).to.eql(true)
      yarnStub.restore()
    })

    it('return false if yarn info error', async () => {
      const yarnStub = sinon.stub(yarn, 'info')
      yarnStub.resolves(yarnInfoError)
      expect(await utils.isDependencyApiOrApiImpl('react-header')).to.eql(false)
      yarnStub.restore()
    })
  })

  // ==========================================================
  // isValidElectrodeNativeModuleName
  // ==========================================================
  describe('isValidElectrodeNativeModuleName', () => {
    fixtures.validElectrodeNativeModuleNames.forEach(name => {
      it('should return true if valid electrode native module name', () => {
        expect(utils.isValidElectrodeNativeModuleName(name)).to.eql(true)
      })
    })

    fixtures.invalidElectrodeNativeModuleNames.forEach(name => {
      it('should return false if valid electrode native module name', () => {
        expect(utils.isValidElectrodeNativeModuleName(name)).to.eql(false)
      })
    })
  })

  // ==========================================================
  // getDownloadedPluginPath
  // ==========================================================
  describe('getDownloadedPluginPath', () => {
    it('return download plugin path for npm plugin', () => {
      const pluginPath = 'node_modules/react-native-code-push'
      const npmPlugin = {
        type: "npm",
        name: "react-native-code-push",
        version: "1.16.1-beta"
      }
      pathStub.returns(pluginPath)
      expect(utils.getDownloadedPluginPath(npmPlugin)).to.eql(pluginPath)
    })

    it('return download plugin path for npm plugin', () => {
      const pluginPath = 'node_modules/@msft/react-native-code-push'
      const npmPluginWithScope = {
        type: "npm",
        name: "@msft/react-native-code-push",
        version: "1.16.1-beta"
      }
      pathStub.returns(pluginPath)
      expect(utils.getDownloadedPluginPath(npmPluginWithScope)).to.eql(pluginPath)
    })

    it('return download plugin path for git plugin', () => {
      const pluginPath = 'https://github.com/aoriani/ReactNative-StackTracer.git'
      const gitPlugin = {
        type: "git",
        url: "https://github.com/aoriani/ReactNative-StackTracer.git",
        version: "0.1.1"
      }
      pathStub.returns(pluginPath)
      expect(utils.getDownloadedPluginPath(gitPlugin)).to.eql('ReactNative-StackTracer')
    })

    it('throw error if plugin path cannot be resolved', () => {
      const unknown = {
        type: "unknown",
        url: "https://github.com/aoriani/ReactNative-StackTracer.git",
        version: "0.1.1"
      }
      try{
        utils.getDownloadedPluginPath(unknown)
      }catch (e){
        expect(e.message).to.include('Unsupported plugin origin type')
      }
    })
  })

})

