import { assert, expect } from 'chai'
import fs from 'fs'
import path from 'path'
import EphemeralFileStore from '../src/EphemeralFileStore'

const fileName = 'testfile'

describe('EphemeralFileStore.js', () => {
  describe('constructor', () => {
    it('should not throw', () => {
      expect(() => new EphemeralFileStore()).to.not.throw()
    })

    it('should create a store path', () => {
      const efs = new EphemeralFileStore()
      expect(efs.storePath).to.be.a('string').not.empty
    })

    it('should not have any pending transaction', () => {
      const efs = new EphemeralFileStore()
      expect(efs.isPendingTransaction).false
    })
  })

  describe('storeFile', () => {
    it('should store the file', async () => {
      const efs = new EphemeralFileStore()
      await efs.storeFile(fileName, 'content')
      assert(fs.statSync(path.join(efs.storePath, fileName)).isFile())
    })
  })

  describe('hasFile', () => {
    it('should return true if the file exists', async () => {
      const efs = new EphemeralFileStore()
      await efs.storeFile(fileName, 'content')
      const result = await efs.hasFile(fileName)
      expect(result).true
    })

    it('should return false if the file does not exists', async () => {
      const efs = new EphemeralFileStore()
      const result = await efs.hasFile(fileName)
      expect(result).false
    })
  })

  describe('getPathToFile', () => {
    it('should return a path to the file', async () => {
      const efs = new EphemeralFileStore()
      await efs.storeFile(fileName, 'content')
      const result = await efs.getPathToFile(fileName)
      expect(result).to.be.a('string')
    })

    it('should return undefined if the file does not exist', async () => {
      const efs = new EphemeralFileStore()
      const result = await efs.getPathToFile('unexisting')
      expect(result).undefined
    })
  })

  describe('getFile', () => {
    it('should return the file', async () => {
      const efs = new EphemeralFileStore()
      await efs.storeFile(fileName, 'content')
      const result = await efs.getFile(fileName)
      expect(result).not.undefined
      expect((<Buffer>result).toString()).eql('content')
    })

    it('should return undefined if the file does not exist', async () => {
      const efs = new EphemeralFileStore()
      const result = await efs.getFile('unexisting')
      expect(result).undefined
    })
  })

  describe('removeFile', () => {
    it('should remove the file', async () => {
      const efs = new EphemeralFileStore()
      await efs.storeFile(fileName, 'content')
      const result = await efs.removeFile(fileName)
      assert(!fs.existsSync(path.join(efs.storePath, fileName)))
    })

    it('should return true if the file was removed', async () => {
      const efs = new EphemeralFileStore()
      await efs.storeFile(fileName, 'content')
      const result = await efs.removeFile(fileName)
      expect(result).true
    })

    it('should return false if the file was not removed', async () => {
      const efs = new EphemeralFileStore()
      const result = await efs.removeFile(fileName)
      expect(result).false
    })
  })

  describe('beginTransaction', () => {
    it('should set isPendingTransaction flag to true', async () => {
      const efs = new EphemeralFileStore()
      await efs.beginTransaction()
      expect(efs.isPendingTransaction).true
    })
  })

  describe('commitTransaction', () => {
    it('should set isPendingTransaction flag to false', async () => {
      const efs = new EphemeralFileStore()
      await efs.beginTransaction()
      await efs.commitTransaction('message')
      expect(efs.isPendingTransaction).false
    })
  })

  describe('discardTransaction', () => {
    it('should set isPendingTransaction flag to false', async () => {
      const efs = new EphemeralFileStore()
      await efs.beginTransaction()
      await efs.discardTransaction()
      expect(efs.isPendingTransaction).false
    })
  })
})
