import { InMemErnConfig } from '../src/config/InMemErnConfig'
import {
  packagesLinksConfigKey,
  PackageLinksConfig,
} from '../src/PackageLinksConfig'
import { expect } from 'chai'

describe('PackageLinksConfig', () => {
  const testPkgLink = {
    isEnabled: true,
    localPath: '/path/to/testPkg',
  }

  describe('add', () => {
    it('should set the package link in config', () => {
      const conf = new InMemErnConfig()
      const sut = new PackageLinksConfig(conf)
      sut.add('testPkg', '/path/to/testPkg')
      expect(conf.get(packagesLinksConfigKey)).deep.equal({
        testPkg: testPkgLink,
      })
    })

    it('should throw if the package is already linked', () => {
      const conf = new InMemErnConfig({
        [packagesLinksConfigKey]: {
          testPkg: {
            isEnabled: true,
            localPath: '/path/to/testPkg',
          },
        },
      })
      const sut = new PackageLinksConfig(conf)
      expect(() => sut.add('testPkg', '/another/path/to/testPkg')).to.throw()
    })
  })

  describe('has', () => {
    it('should return true if there is a link configured for the package', () => {
      const conf = new InMemErnConfig({
        [packagesLinksConfigKey]: {
          testPkg: testPkgLink,
        },
      })
      const sut = new PackageLinksConfig(conf)
      expect(sut.has('testPkg')).true
    })

    it('should return false if there is no link configured for the package', () => {
      const conf = new InMemErnConfig()
      const sut = new PackageLinksConfig(conf)
      expect(sut.has('testPkg')).false
    })
  })

  describe('get', () => {
    it('should return the package link if it exist', () => {
      const conf = new InMemErnConfig({
        [packagesLinksConfigKey]: {
          testPkg: testPkgLink,
        },
      })
      const sut = new PackageLinksConfig(conf)
      expect(sut.get('testPkg')).deep.equal(testPkgLink)
    })

    it('should throw if the package link does not exist', () => {
      const conf = new InMemErnConfig()
      const sut = new PackageLinksConfig(conf)
      expect(() => sut.get('testPkg')).to.throw()
    })
  })

  describe('getAll', () => {
    it('should return all package links', () => {
      const links = {
        testPkg: testPkgLink,
        testPkgOther: {
          isEnabled: true,
          localPath: '/path/to/testPkgOther',
        },
      }
      const conf = new InMemErnConfig({
        [packagesLinksConfigKey]: links,
      })
      const sut = new PackageLinksConfig(conf)
      expect(sut.getAll()).deep.equal(links)
    })
  })

  describe('isEnabled', () => {
    it('should return true if the package link is enabled', () => {
      const conf = new InMemErnConfig({
        [packagesLinksConfigKey]: {
          testPkg: {
            isEnabled: true,
            localPath: '/path/to/testPkg',
          },
        },
      })
      const sut = new PackageLinksConfig(conf)
      expect(sut.isEnabled('testPkg')).true
    })

    it('should return false if the package link is disabled', () => {
      const conf = new InMemErnConfig({
        [packagesLinksConfigKey]: {
          testPkg: {
            isEnabled: false,
            localPath: '/path/to/testPkg',
          },
        },
      })
      const sut = new PackageLinksConfig(conf)
      expect(sut.isEnabled('testPkg')).false
    })

    it('should throw if the package link does not exist', () => {
      const conf = new InMemErnConfig()
      const sut = new PackageLinksConfig(conf)
      expect(() => sut.isEnabled('testPkg')).to.throw()
    })
  })

  describe('remove', () => {
    it('should remove the package link', () => {
      const conf = new InMemErnConfig({
        [packagesLinksConfigKey]: {
          testPkg: {
            isEnabled: true,
            localPath: '/path/to/testPkg',
          },
        },
      })
      const sut = new PackageLinksConfig(conf)
      sut.remove('testPkg')
      expect(conf.get(packagesLinksConfigKey)).deep.equal({})
    })

    it('should throw if the package link does not exist', () => {
      const conf = new InMemErnConfig()
      const sut = new PackageLinksConfig(conf)
      expect(() => sut.remove('testPkg')).to.throw()
    })
  })

  describe('disable', () => {
    it('should disable the package link', () => {
      const conf = new InMemErnConfig({
        [packagesLinksConfigKey]: {
          testPkg: {
            isEnabled: true,
            localPath: '/path/to/testPkg',
          },
        },
      })
      const sut = new PackageLinksConfig(conf)
      sut.disable('testPkg')
      expect(conf.get(packagesLinksConfigKey)).deep.equal({
        testPkg: {
          isEnabled: false,
          localPath: '/path/to/testPkg',
        },
      })
    })

    it('should return the disabled package link', () => {
      const conf = new InMemErnConfig({
        [packagesLinksConfigKey]: {
          testPkg: {
            isEnabled: true,
            localPath: '/path/to/testPkg',
          },
        },
      })
      const sut = new PackageLinksConfig(conf)
      const res = sut.disable('testPkg')
      expect(res).deep.equal({
        isEnabled: false,
        localPath: '/path/to/testPkg',
      })
    })

    it('should throw if the package link does not exist', () => {
      const conf = new InMemErnConfig()
      const sut = new PackageLinksConfig(conf)
      expect(() => sut.disable('testPkg')).to.throw()
    })
  })

  describe('enable', () => {
    it('should enable the package link', () => {
      const conf = new InMemErnConfig({
        [packagesLinksConfigKey]: {
          testPkg: {
            isEnabled: false,
            localPath: '/path/to/testPkg',
          },
        },
      })
      const sut = new PackageLinksConfig(conf)
      sut.enable('testPkg')
      expect(conf.get(packagesLinksConfigKey)).deep.equal({
        testPkg: {
          isEnabled: true,
          localPath: '/path/to/testPkg',
        },
      })
    })

    it('should return the enabled package link', () => {
      const conf = new InMemErnConfig({
        [packagesLinksConfigKey]: {
          testPkg: {
            isEnabled: false,
            localPath: '/path/to/testPkg',
          },
        },
      })
      const sut = new PackageLinksConfig(conf)
      const res = sut.enable('testPkg')
      expect(res).deep.equal({
        isEnabled: true,
        localPath: '/path/to/testPkg',
      })
    })

    it('should throw if the package link does not exist', () => {
      const conf = new InMemErnConfig()
      const sut = new PackageLinksConfig(conf)
      expect(() => sut.enable('testPkg')).to.throw()
    })
  })

  describe('update', () => {
    it('should update the package link path', () => {
      const conf = new InMemErnConfig({
        [packagesLinksConfigKey]: {
          testPkg: {
            isEnabled: true,
            localPath: '/path/to/testPkg',
          },
        },
      })
      const sut = new PackageLinksConfig(conf)
      sut.update('testPkg', '/new/path/to/testPkg')
      expect(conf.get(packagesLinksConfigKey)).deep.equal({
        testPkg: {
          isEnabled: true,
          localPath: '/new/path/to/testPkg',
        },
      })
    })

    it('should return the updated package link', () => {
      const conf = new InMemErnConfig({
        [packagesLinksConfigKey]: {
          testPkg: {
            isEnabled: true,
            localPath: '/path/to/testPkg',
          },
        },
      })
      const sut = new PackageLinksConfig(conf)
      const res = sut.update('testPkg', '/new/path/to/testPkg')
      expect(res).deep.equal({
        isEnabled: true,
        localPath: '/new/path/to/testPkg',
      })
    })

    it('should throw if the package link does not exist', () => {
      const conf = new InMemErnConfig()
      const sut = new PackageLinksConfig(conf)
      expect(() => sut.update('testPkg', '/new/path/to/testPkg')).to.throw()
    })
  })
})
