import { assert, expect } from 'chai'
import { fixtures } from 'ern-util-dev'
import fs from 'fs'
import path from 'path'
import InMemoryDocumentStore from '../src/InMemoryDocumentStore'
import { Cauldron } from '../src/FlowTypes'
import sinon from 'sinon'
const sandbox = sinon.createSandbox()

describe('InMemoryDocumentStore.js', () => {
  afterEach(() => {
    sandbox.restore()
  })

  describe('constructor', () => {
    it('should throw if the initial Cauldron document is missing', () => {
      expect(() => new InMemoryDocumentStore(undefined!)).to.throw()
    })

    it('should not throw if an initial Cauldron document is provided', () => {
      expect(() => new InMemoryDocumentStore(<Cauldron>{})).to.not.throw()
    })

    it('should have any pending transaction after construction', () => {
      const efs = new InMemoryDocumentStore(fixtures.emptyCauldron)
      expect(efs.isPendingTransaction).false
    })

    it('should not have any latest commit message after construction', () => {
      const efs = new InMemoryDocumentStore(fixtures.emptyCauldron)
      expect(efs.latestCommitMessage).undefined
    })
  })

  describe('commit', () => {
    it('should commit and update the commit message if no transaction is pending', async () => {
      const efs = new InMemoryDocumentStore(fixtures.emptyCauldron)
      await efs.commit('commit-message')
      expect(efs.latestCommitMessage).eql('commit-message')
    })

    it('should not commit and nor update the commit message if a transaction is pending', async () => {
      const efs = new InMemoryDocumentStore(fixtures.emptyCauldron)
      await efs.beginTransaction()
      await efs.commit('commit-message')
      expect(efs.latestCommitMessage).undefined
    })

    it('should commit and update the latest comitted cauldron if not transaction is pending', async () => {
      const fixtureClone = JSON.parse(JSON.stringify(fixtures.emptyCauldron))
      const efs = new InMemoryDocumentStore(fixtureClone)
      fixtureClone.config = {}
      await efs.commit('commit-message')
      expect(efs.latestCommitedCauldron).eql(fixtureClone)
    })

    it('should not commit nor update the latest comitted cauldron if a transaction is pending', async () => {
      const fixtureClone = JSON.parse(JSON.stringify(fixtures.emptyCauldron))
      const efs = new InMemoryDocumentStore(fixtureClone)
      fixtureClone.config = {}
      await efs.beginTransaction()
      await efs.commit('commit-message')
      expect(efs.latestCommitedCauldron).undefined
    })
  })

  describe('beginTransaction', () => {
    it('should set isPendingTransaction to true', async () => {
      const efs = new InMemoryDocumentStore(fixtures.emptyCauldron)
      await efs.beginTransaction()
      expect(efs.isPendingTransaction).true
    })
  })

  describe('commitTransaction', () => {
    it('should set isPendingTransaction to false', async () => {
      const efs = new InMemoryDocumentStore(fixtures.emptyCauldron)
      await efs.beginTransaction()
      await efs.commitTransaction('commit-message')
      expect(efs.isPendingTransaction).false
    })

    it('should call commit if a transaction is pending', async () => {
      const efs = new InMemoryDocumentStore(fixtures.emptyCauldron)
      const commitStub = sandbox.stub(efs, 'commit')
      await efs.beginTransaction()
      await efs.commitTransaction('commit-message')
      sandbox.assert.calledOnce(commitStub)
    })

    it('should not call commit if no transaction is pending', async () => {
      const efs = new InMemoryDocumentStore(fixtures.emptyCauldron)
      const commitStub = sandbox.stub(efs, 'commit')
      await efs.commitTransaction('commit-message')
      sandbox.assert.notCalled(commitStub)
    })
  })

  describe('discardTransaction', () => {
    it('should set isPendingTransaction to false', async () => {
      const efs = new InMemoryDocumentStore(fixtures.emptyCauldron)
      await efs.beginTransaction()
      await efs.discardTransaction()
      expect(efs.isPendingTransaction).false
    })
  })
})
