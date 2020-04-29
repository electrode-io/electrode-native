import { expect } from 'chai'
import {
  findDirectoriesContainingNativeCode,
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

describe('nativeDependenciesLookup.ts', () => {
  beforeEach(() => {
    sandbox.stub(manifest, 'getNativeDependency').resolves()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('findDirectoriesContainingNativeCode', () => {
    it('should find all directories containing native code', () => {
      const result = findDirectoriesContainingNativeCode(pathToFixture)
      const expectedResult = [
        '@scoped-pkgs/pkg-native-a/src/code.swift',
        '@scoped-pkgs/pkg-native-b/src/code.java',
        'pkg-native-c/src/code.swift',
        'pkg-native-d/src/code.java',
        '@scoped-pkgs/nested/node_modules/pkg-native-e/src/code.swift',
      ].map(p => p.replace(/\//g, path.sep))
      expect(expectedResult).to.have.members(result)
    })
  })

  describe('resolvePackagePaths', () => {
    it('should properly resolve packages paths', () => {
      const result = Array.from(
        resolvePackagePaths(
          [
            '@scoped-pkgs/pkg-native-a/src/code.swift',
            '@scoped-pkgs/pkg-native-b/src/code.java',
            'pkg-native-c/src/code.swift',
            'pkg-native-d/src/code.java',
            '@scoped-pkgs/nested/node_modules/pkg-native-e/src/code.swift',
            '@scoped-pkgs/nested/node_modules/@scope/pkg-native-e/src/code.swift',
          ].map(p => p.replace(/\//g, path.sep))
        )
      )
      const expectedResult = [
        '@scoped-pkgs/pkg-native-a',
        '@scoped-pkgs/pkg-native-b',
        'pkg-native-c',
        'pkg-native-d',
        '@scoped-pkgs/nested/node_modules/pkg-native-e',
        '@scoped-pkgs/nested/node_modules/@scope/pkg-native-e',
      ].map(p => p.replace(/\//g, path.sep))
      expect(expectedResult).to.have.members(result)
    })
  })
})
