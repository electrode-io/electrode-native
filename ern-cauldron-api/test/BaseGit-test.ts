import * as core from 'ern-core'
import { createTmpDir } from 'ern-core'
import { doesThrow } from 'ern-util-dev'
import BaseGit from '../src/BaseGit'
import fs from 'fs'
import path from 'path'
import sinon from 'sinon'
import { assert, expect } from 'chai'
import git from 'simple-git/promise'

const sandbox = sinon.createSandbox()

describe('BaseGit', () => {
  let gitCliStub: any
  let gitStub: any

  beforeEach(() => {
    gitStub = sandbox.stub(git())
    gitCliStub = sandbox.stub(core, 'gitCli').returns(gitStub)
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('constructor', () => {
    it('should create the local repository directory if it does not exist', () => {
      const cauldronPath = path.join(createTmpDir(), 'cauldron')
      const repository = 'git@github.com:test/test.git'
      const baseGit = new BaseGit({ cauldronPath, repository })
      assert(fs.existsSync(cauldronPath))
    })

    it('should use master branch by default', () => {
      const cauldronPath = path.join(createTmpDir(), 'cauldron')
      const repository = 'git@github.com:test/test.git'
      const baseGit = new BaseGit({ cauldronPath, repository })
      expect(baseGit.branch).eql('master')
    })

    it('should use the provided branch if any', () => {
      const cauldronPath = path.join(createTmpDir(), 'cauldron')
      const repository = 'git@github.com:test/test.git'
      const baseGit = new BaseGit({
        branch: 'development',
        cauldronPath,
        repository,
      })
      expect(baseGit.branch).eql('development')
    })

    it('should work if not provided with a remote repository [local cauldron]', () => {
      const cauldronPath = path.join(createTmpDir(), 'cauldron')
      const baseGit = new BaseGit({
        cauldronPath,
      })
      expect(baseGit.repository).undefined
    })

    it('should create a git client', () => {
      const cauldronPath = path.join(createTmpDir(), 'cauldron')
      const repository = 'git@github.com:test/test.git'
      const baseGit = new BaseGit({
        branch: 'development',
        cauldronPath,
        repository,
      })
      sandbox.assert.calledWith(gitCliStub, cauldronPath)
    })
  })

  describe('push', () => {
    it('shoud do a git push if the instance is a remote cauldron', async () => {
      const cauldronPath = path.join(createTmpDir(), 'cauldron')
      const repository = 'git@github.com:test/test.git'
      const baseGit = new BaseGit({ cauldronPath, repository })
      await baseGit.push()
      sandbox.assert.calledWith(gitStub.push, 'upstream', 'master')
    })

    it('shoud not do a git push if the instance is a local cauldron', async () => {
      const cauldronPath = path.join(createTmpDir(), 'cauldron')
      const baseGit = new BaseGit({ cauldronPath })
      await baseGit.push()
      sandbox.assert.notCalled(gitStub.push)
    })
  })

  describe('sync', () => {
    it('should create the local git repository if it does not exist [local cauldron]', async () => {
      const cauldronPath = path.join(createTmpDir(), 'cauldron')
      const baseGit = new BaseGit({ cauldronPath })
      await baseGit.sync()
      sandbox.assert.called(gitStub.init)
    })

    it('should create the local git repository if it does not exist [remote cauldron]', async () => {
      const cauldronPath = path.join(createTmpDir(), 'cauldron')
      const repository = 'git@github.com:test/test.git'
      const baseGit = new BaseGit({ cauldronPath, repository })
      await baseGit.sync()
      sandbox.assert.called(gitStub.init)
    })

    it('should set the remote url [remote cauldron]', async () => {
      const cauldronPath = path.join(createTmpDir(), 'cauldron')
      const repository = 'git@github.com:test/test.git'
      const baseGit = new BaseGit({ cauldronPath, repository })
      await baseGit.sync()
      sandbox.assert.calledWith(gitStub.raw, [
        'remote',
        'set-url',
        'upstream',
        repository,
      ])
    })

    it('should do a git push if the remote repository is empty [remote cauldron initial sync]', async () => {
      const cauldronPath = path.join(createTmpDir(), 'cauldron')
      const repository = 'git@github.com:test/test.git'
      const baseGit = new BaseGit({ cauldronPath, repository })
      await baseGit.sync()
      sandbox.assert.called(gitStub.push)
    })

    it('should not do any git operation if there is a pending transaction [remote cauldron]', async () => {
      const cauldronPath = path.join(createTmpDir(), 'cauldron')
      const repository = 'git@github.com:test/test.git'
      const baseGit = new BaseGit({ cauldronPath, repository })
      await baseGit.beginTransaction()
      sandbox.reset()
      await baseGit.sync()
      sandbox.assert.notCalled(gitStub.raw)
      sandbox.assert.notCalled(gitStub.init)
      sandbox.assert.notCalled(gitStub.push)
    })

    it('should not do any git operation if a sync has already been done [remote cauldron. sync already performed]', async () => {
      const cauldronPath = path.join(createTmpDir(), 'cauldron')
      const repository = 'git@github.com:test/test.git'
      const baseGit = new BaseGit({ cauldronPath, repository })
      await baseGit.sync()
      sandbox.reset()
      await baseGit.sync()
      sandbox.assert.notCalled(gitStub.raw)
      sandbox.assert.notCalled(gitStub.init)
      sandbox.assert.notCalled(gitStub.push)
    })
  })

  describe('beginTransaction', () => {
    it('should throw if a transaction is already pending', async () => {
      const cauldronPath = path.join(createTmpDir(), 'cauldron')
      const repository = 'git@github.com:test/test.git'
      const baseGit = new BaseGit({ cauldronPath, repository })
      await baseGit.beginTransaction()
      assert(await doesThrow(baseGit.beginTransaction, baseGit))
    })
  })

  describe('discardTransaction', () => {
    it('should throw if there is no pending transaction', async () => {
      const cauldronPath = path.join(createTmpDir(), 'cauldron')
      const repository = 'git@github.com:test/test.git'
      const baseGit = new BaseGit({ cauldronPath, repository })
      assert(await doesThrow(baseGit.discardTransaction, baseGit))
    })

    it('should do a git reset --hard', async () => {
      const cauldronPath = path.join(createTmpDir(), 'cauldron')
      const repository = 'git@github.com:test/test.git'
      const baseGit = new BaseGit({ cauldronPath, repository })
      await baseGit.beginTransaction()
      await baseGit.discardTransaction()
      sandbox.assert.calledWith(gitStub.reset, ['--hard'])
    })
  })

  describe('commitTransaction', () => {
    it('should throw if there is no pending transaction', async () => {
      const cauldronPath = path.join(createTmpDir(), 'cauldron')
      const repository = 'git@github.com:test/test.git'
      const baseGit = new BaseGit({ cauldronPath, repository })
      assert(
        await doesThrow(baseGit.commitTransaction, baseGit, 'commit-message')
      )
    })

    it('should do a git commit', async () => {
      const cauldronPath = path.join(createTmpDir(), 'cauldron')
      const repository = 'git@github.com:test/test.git'
      const baseGit = new BaseGit({ cauldronPath, repository })
      await baseGit.beginTransaction()
      await baseGit.commitTransaction('commit-message')
      sandbox.assert.calledWith(gitStub.commit, 'commit-message')
    })
  })
})
