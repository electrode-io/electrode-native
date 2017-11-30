// @flow 

import mockFs from 'mock-fs'
import os from 'os'
import path from 'path'
import {
  assert,
  expect
} from 'chai'
import {
  getCodePushSdk,
  getCodePushAccessKey
} from '../src/lib/publication'

const ernRcPath = path.join(os.homedir(), '.ern', '.ernrc')
const codePushConfigPath = path.join(os.homedir(), '.code-push.config')
const ernRcCodePushAccessKey = '0e2509c78c4f94c25e69131a0a5e5be3b7d2927b'
const codePushConfigAccessKey = '1e2509c78c4f94c25e69131a0a5e5be3b7d2927b'

const ernRcWithCodePushAccessKey = JSON.stringify({codePushAccessKey: ernRcCodePushAccessKey})
const codePushConfigWithAccessKey = JSON.stringify({accessKey: codePushConfigAccessKey})
const ernRcWithoutCodePushAccessKey= JSON.stringify({})
const codePushConfigWithoutAccessKey = JSON.stringify({})


describe('lib/publication.js', () => {
  afterEach(() => {
    mockFs.restore()
  })

  // ==========================================================
  // getCodePushAccessKey
  // ==========================================================
  describe('getCodePushAccessKey', () => {
    it('should return the access key from platform config if keys are present in both config files', () => {
      mockFs({
        [ernRcPath]: ernRcWithCodePushAccessKey,
        [codePushConfigPath]: codePushConfigWithAccessKey
      }, {
        createCwd: false
      })
      expect(getCodePushAccessKey()).to.be.equal(ernRcCodePushAccessKey)
    })

    it('should return the access key from code push config if key is not present in .ernrc', () => {
      mockFs({
        [ernRcPath]: ernRcWithoutCodePushAccessKey,
        [codePushConfigPath]: codePushConfigWithAccessKey
      }, {
        createCwd: false
      })
      expect(getCodePushAccessKey()).to.be.equal(codePushConfigAccessKey)
    })

    it('should return undefined if key is not found in .ernrc nor in .code-push.config', () => {
      mockFs({
        [ernRcPath]: ernRcWithoutCodePushAccessKey,
        [codePushConfigPath]: codePushConfigWithoutAccessKey
      }, {
        createCwd: false
      })
      expect(getCodePushAccessKey()).to.be.undefined
    })

    it('should return undefined if key is not found in .ernrc and .code-push.config does not exist', () => {
      mockFs({
        [ernRcPath]: ernRcWithoutCodePushAccessKey
      }, {
        createCwd: false
      })
      expect(getCodePushAccessKey()).to.be.undefined
    })
  })

  // ==========================================================
  // getCodePushSdk
  // ==========================================================
  describe('getCodePushSdk', () => {
    it('should not throw if an access key exists', () => {
      mockFs({
        [ernRcPath]: ernRcWithCodePushAccessKey,
        [codePushConfigPath]: codePushConfigWithoutAccessKey
      }, {
        createCwd: false
      })
      expect(getCodePushSdk).to.not.throw()
    })

    it('should throw if no access key exists', () => {
      mockFs({
        [ernRcPath]: ernRcWithoutCodePushAccessKey,
        [codePushConfigPath]: codePushConfigWithoutAccessKey
      }, {
        createCwd: false
      })
      expect(getCodePushSdk).to.throw()
    })
  })
})