import { expect, assert } from 'chai'
import {
  findDirectoriesContainingNativeCode,
  findNativeDependencies,
  resolvePackagePaths,
} from '../src/nativeDependenciesLookup'
import path from 'path'
import _ from 'lodash'
import sinon from 'sinon'
import { manifest } from '../src/Manifest'

const sandbox = sinon.createSandbox()

const pathToFixture = path.join(
  __dirname,
  'fixtures',
  'nativeDependenciesLookup'
)

const nativeDependenciesResult = {
  all: [
    {
      basePath: 'pkg-native-e',
      fullPath: 'pkg-native-e@1.0.0',
      version: '1.0.0',
    },
    {
      basePath: '@scoped-pkgs/pkg-native-a',
      fullPath: '@scoped-pkgs/pkg-native-a@1.0.0',
      version: '1.0.0',
    },
    {
      basePath: '@scoped-pkgs/pkg-native-b',
      fullPath: '@scoped-pkgs/pkg-native-b@1.0.0',
      version: '1.0.0',
    },
    {
      basePath: 'pkg-native-c',
      fullPath: 'pkg-native-c@1.0.0',
      version: '1.0.0',
    },
    {
      basePath: 'pkg-native-d',
      fullPath: 'pkg-native-d@1.0.0',
      version: '1.0.0',
    },
  ],
  apis: [],
  nativeApisImpl: [],
  thirdPartyInManifest: [
    {
      basePath: 'pkg-native-e',
      fullPath: 'pkg-native-e@1.0.0',
      version: '1.0.0',
    },
    {
      basePath: '@scoped-pkgs/pkg-native-a',
      fullPath: '@scoped-pkgs/pkg-native-a@1.0.0',
      version: '1.0.0',
    },
    {
      basePath: '@scoped-pkgs/pkg-native-b',
      fullPath: '@scoped-pkgs/pkg-native-b@1.0.0',
      version: '1.0.0',
    },
    {
      basePath: 'pkg-native-c',
      fullPath: 'pkg-native-c@1.0.0',
      version: '1.0.0',
    },
    {
      basePath: 'pkg-native-d',
      fullPath: 'pkg-native-d@1.0.0',
      version: '1.0.0',
    },
  ],
  thirdPartyNotInManifest: [],
}

describe('nativeDependenciesLookup.ts', () => {
  beforeEach(() => {
    sandbox.stub(manifest, 'getNativeDependency').resolves(true)
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('findDirectoriesContainingNativeCode', () => {
    it('should find all directories containing native code', () => {
      const result = findDirectoriesContainingNativeCode(pathToFixture)
      const xored = _.xor(result, [
        '@scoped-pkgs/pkg-native-a/src/code.swift',
        '@scoped-pkgs/pkg-native-b/src/code.java',
        'pkg-native-c/src/code.swift',
        'pkg-native-d/src/code.java',
        '@scoped-pkgs/nested/node_modules/pkg-native-e/src/code.swift',
      ])
      assert(xored.length === 0)
    })
  })

  describe('resolvePackagePaths', () => {
    it('should properly resolve packages paths', () => {
      const result = Array.from(
        resolvePackagePaths([
          '@scoped-pkgs/pkg-native-a/src/code.swift',
          '@scoped-pkgs/pkg-native-b/src/code.java',
          'pkg-native-c/src/code.swift',
          'pkg-native-d/src/code.java',
          '@scoped-pkgs/nested/node_modules/pkg-native-e/src/code.swift',
        ])
      )
      const expectedResult = [
        '@scoped-pkgs/pkg-native-a',
        '@scoped-pkgs/pkg-native-b',
        'pkg-native-c',
        'pkg-native-d',
        '@scoped-pkgs/nested/node_modules/pkg-native-e',
      ]
      const xored = _.xor(result, expectedResult)
      assert(xored.length === 0)
    })
  })

  describe('findNativeDependencies', () => {
    it('should return the correct native dependencies', async () => {
      const result = await findNativeDependencies(pathToFixture)
      expect(result).to.deep.equal(nativeDependenciesResult)
    })
  })
})
