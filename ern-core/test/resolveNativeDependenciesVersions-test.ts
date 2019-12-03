import { expect } from 'chai'
import { NativeDependencies } from '../src/nativeDependenciesLookup'
import { PackagePath } from '../src/PackagePath'
import {
  containsVersionMismatch,
  resolveNativeDependenciesVersions,
  retainHighestVersions,
} from '../src/resolveNativeDependenciesVersions'

// ==========================================================
// containsVersionMismatch
// ==========================================================
const versionsWithAMajorMismatch = ['1.0.0', '2.0.0', '1.0.0']
const versionsWithAMinorMismatch = ['1.0.0', '1.1.0', '1.0.0']
const versionsWithAPatchMismatch = ['1.0.0', '1.0.1', '1.0.0']
const versionsWithoutMismatch = ['1.0.0', '1.0.0', '1.0.0']

describe('containsVersionMismatch', () => {
  it('should return true if mismatch level is set to major and there is at least one major version mismatch', () => {
    expect(containsVersionMismatch(versionsWithAMajorMismatch, 'major')).true
  })

  it('should return false if mismatch level is set to major and there is no major version mismatch [1]', () => {
    expect(containsVersionMismatch(versionsWithAMinorMismatch, 'major')).false
  })

  it('should return false if mismatch level is set to major and there is no major version mismatch [2]', () => {
    expect(containsVersionMismatch(versionsWithAPatchMismatch, 'major')).false
  })

  it('should return false if mismatch level is set to major and there is no major version mismatch [3]', () => {
    expect(containsVersionMismatch(versionsWithoutMismatch, 'major')).false
  })

  it('should return true if mismatch level is set to minor and there is at least one major version mismatch', () => {
    expect(containsVersionMismatch(versionsWithAMajorMismatch, 'minor')).true
  })

  it('should return true if mismatch level is set to minor and there is at least one minor version mismatch', () => {
    expect(containsVersionMismatch(versionsWithAMinorMismatch, 'minor')).true
  })

  it('should return false if mismatch level is set to minor and there no minor version mismatch [1]', () => {
    expect(containsVersionMismatch(versionsWithAPatchMismatch, 'minor')).false
  })

  it('should return false if mismatch level is set to minor and there no minor version mismatch [1]', () => {
    expect(containsVersionMismatch(versionsWithoutMismatch, 'minor')).false
  })

  it('should return true if mismatch level is set to patch and there is at least one major version mismatch', () => {
    expect(containsVersionMismatch(versionsWithAMajorMismatch, 'patch')).true
  })

  it('should return true if mismatch level is set to patch and there is at least one minor version mismatch', () => {
    expect(containsVersionMismatch(versionsWithAMinorMismatch, 'patch')).true
  })

  it('should return true if mismatch level is set to patch and there is at least one patch version mismatch', () => {
    expect(containsVersionMismatch(versionsWithAPatchMismatch, 'patch')).true
  })

  it('should return false if mismatch level is set to patch and there is no patch version mismatch', () => {
    expect(containsVersionMismatch(versionsWithoutMismatch, 'patch')).false
  })
})

// ==========================================================
// retainHighestVersions
// ==========================================================
describe('retainHighestVersion', () => {
  it('should work as expected', () => {
    const arrA = [
      PackagePath.fromString('dependencyA@1.0.0'),
      PackagePath.fromString('dependencyB@2.0.1'),
      PackagePath.fromString('dependencyC@1.0.0'),
      PackagePath.fromString('dependencyD@1.0.0'),
    ]

    const arrB = [
      PackagePath.fromString('dependencyA@2.0.0'),
      PackagePath.fromString('dependencyB@2.0.0'),
      PackagePath.fromString('dependencyC@1.1.0'),
      PackagePath.fromString('dependencyE@1.0.0'),
      PackagePath.fromString('dependencyF@3.0.0'),
    ]

    const result = retainHighestVersions(arrA, arrB)
    const stringifedResult = result.map(p => p.toString())
    expect(stringifedResult).length(6)
    expect(stringifedResult).includes('dependencyA@2.0.0')
    expect(stringifedResult).includes('dependencyB@2.0.1')
    expect(stringifedResult).includes('dependencyC@1.1.0')
    expect(stringifedResult).includes('dependencyD@1.0.0')
    expect(stringifedResult).includes('dependencyE@1.0.0')
    expect(stringifedResult).includes('dependencyF@3.0.0')
  })
})

// ==========================================================
// resolveNativeDependenciesVersions
// ==========================================================
describe('resolveNativeDependenciesVersions', () => {
  it('should work as expected [different native dependencies]', () => {
    const fixture: NativeDependencies[] = [
      {
        all: [
          {
            packagePath: PackagePath.fromString('apiOne@1.0.0'),
            path: '/Users/foo/composite/node_modules/apiOne',
          },
          {
            packagePath: PackagePath.fromString('apiTwo@1.0.0'),
            path: '/Users/foo/composite/node_modules/apiTwo',
          },
          {
            packagePath: PackagePath.fromString('nativeApiImplOne@1.0.0'),
            path: '/Users/foo/composite/node_modules/nativeApiImplOne',
          },
          {
            packagePath: PackagePath.fromString('nativeModuleOne@1.0.0'),
            path: '/Users/foo/composite/node_modules/nativeModuleOne',
          },
        ],
        apis: [
          {
            packagePath: PackagePath.fromString('apiOne@1.0.0'),
            path: '/Users/foo/composite/node_modules/apiOne',
          },
          {
            packagePath: PackagePath.fromString('apiTwo@1.0.0'),
            path: '/Users/foo/composite/node_modules/apiTwo',
          },
        ],
        nativeApisImpl: [
          {
            packagePath: PackagePath.fromString('nativeApiImplOne@1.0.0'),
            path: '/Users/foo/composite/node_modules/nativeApiImplOne',
          },
        ],
        thirdPartyInManifest: [
          {
            packagePath: PackagePath.fromString('nativeModuleOne@1.0.0'),
            path: '/Users/foo/composite/node_modules/nativeModuleOne',
          },
        ],
        thirdPartyNotInManifest: [],
      },
    ]

    const result = resolveNativeDependenciesVersions(fixture)
    expect(result.resolved).length(4)
    expect(result.pluginsWithMismatchingVersions).empty
  })

  it('should work as expected [same api with different patch version]', () => {
    const fixture: NativeDependencies[] = [
      {
        all: [
          {
            packagePath: PackagePath.fromString('apiOne@1.0.0'),
            path: '/Users/foo/composite/node_modules/apiOne',
          },
          {
            packagePath: PackagePath.fromString('apiOne@1.0.1'),
            path: '/Users/foo/composite/node_modules/miniAppA/apiOne',
          },
          {
            packagePath: PackagePath.fromString('nativeApiImplOne@1.0.0'),
            path: '/Users/foo/composite/node_modules/nativeApiImplOne',
          },
          {
            packagePath: PackagePath.fromString('nativeModuleOne@1.0.0'),
            path: '/Users/foo/composite/node_modules/nativeModuleOne',
          },
        ],
        apis: [
          {
            packagePath: PackagePath.fromString('apiOne@1.0.0'),
            path: '/Users/foo/composite/node_modules/apiOne',
          },
          {
            packagePath: PackagePath.fromString('apiOne@1.0.1'),
            path: '/Users/foo/composite/node_modules/miniAppA/apiOne',
          },
        ],
        nativeApisImpl: [
          {
            packagePath: PackagePath.fromString('nativeApiImplOne@1.0.0'),
            path: '/Users/foo/composite/node_modules/nativeApiImplOne',
          },
        ],
        thirdPartyInManifest: [
          {
            packagePath: PackagePath.fromString('nativeModuleOne@1.0.0'),
            path: '/Users/foo/composite/node_modules/nativeModuleOne',
          },
        ],
        thirdPartyNotInManifest: [],
      },
    ]

    const result = resolveNativeDependenciesVersions(fixture)
    expect(result.resolved).length(3)
    expect(result.pluginsWithMismatchingVersions).empty
    const resolvedDepsAsStrings = result.resolved.map(r => r.toString())
    expect(resolvedDepsAsStrings).includes('apiOne@1.0.1')
  })

  it('should work as expected [same api with different minor version]', () => {
    const fixture = [
      {
        all: [
          {
            packagePath: PackagePath.fromString('apiOne@1.0.0'),
            path: '/Users/foo/composite/node_modules/apiOne',
          },
          {
            packagePath: PackagePath.fromString('apiOne@1.1.0'),
            path: '/Users/foo/composite/node_modules/miniAppA/apiOne',
          },
          {
            packagePath: PackagePath.fromString('nativeApiImplOne@1.0.0'),
            path: '/Users/foo/composite/node_modules/nativeApiImplOne',
          },
          {
            packagePath: PackagePath.fromString('nativeModuleOne@1.0.0'),
            path: '/Users/foo/composite/node_modules/nativeModuleOne',
          },
        ],
        apis: [
          {
            packagePath: PackagePath.fromString('apiOne@1.0.0'),
            path: '/Users/foo/composite/node_modules/apiOne',
          },
          {
            packagePath: PackagePath.fromString('apiOne@1.1.0'),
            path: '/Users/foo/composite/node_modules/miniAppA/apiOne',
          },
        ],
        nativeApisImpl: [
          {
            packagePath: PackagePath.fromString('nativeApiImplOne@1.0.0'),
            path: '/Users/foo/composite/node_modules/nativeApiImplOne',
          },
        ],
        thirdPartyInManifest: [
          {
            packagePath: PackagePath.fromString('nativeModuleOne@1.0.0'),
            path: '/Users/foo/composite/node_modules/nativeModuleOne',
          },
        ],
        thirdPartyNotInManifest: [],
      },
    ]

    const result = resolveNativeDependenciesVersions(fixture)
    expect(result.resolved).length(3)
    expect(result.pluginsWithMismatchingVersions).empty
    const resolvedDepsAsStrings = result.resolved.map(r => r.toString())
    expect(resolvedDepsAsStrings).includes('apiOne@1.1.0')
  })

  it('should work as expected [same api with same version]', () => {
    const fixture = [
      {
        all: [
          {
            packagePath: PackagePath.fromString('apiOne@1.0.0'),
            path: '/Users/foo/composite/node_modules/apiOne',
          },
          {
            packagePath: PackagePath.fromString('apiOne@1.0.0'),
            path: '/Users/foo/composite/node_modules/apiOne',
          },
          {
            packagePath: PackagePath.fromString('nativeApiImplOne@1.0.0'),
            path: '/Users/foo/composite/node_modules/nativeApiImplOne',
          },
          {
            packagePath: PackagePath.fromString('nativeModuleOne@1.0.0'),
            path: '/Users/foo/composite/node_modules/nativeModuleOne',
          },
        ],
        apis: [
          {
            packagePath: PackagePath.fromString('apiOne@1.0.0'),
            path: '/Users/foo/composite/node_modules/apiOne',
          },
          {
            packagePath: PackagePath.fromString('apiOne@1.0.0'),
            path: '/Users/foo/composite/node_modules/apiOne',
          },
        ],
        nativeApisImpl: [
          {
            packagePath: PackagePath.fromString('nativeApiImplOne@1.0.0'),
            path: '/Users/foo/composite/node_modules/nativeApiImplOne',
          },
        ],
        thirdPartyInManifest: [
          {
            packagePath: PackagePath.fromString('nativeModuleOne@1.0.0'),
            path: '/Users/foo/composite/node_modules/nativeModuleOne',
          },
        ],
        thirdPartyNotInManifest: [],
      },
    ]

    const result = resolveNativeDependenciesVersions(fixture)
    expect(result.resolved).length(3)
  })

  it('should work as expected [same api with different major version]', () => {
    const fixture = [
      {
        all: [
          {
            packagePath: PackagePath.fromString('apiOne@1.0.0'),
            path: '/Users/foo/composite/node_modules/apiOne',
          },
          {
            packagePath: PackagePath.fromString('apiOne@2.0.0'),
            path: '/Users/foo/composite/node_modules/apiOne',
          },
          {
            packagePath: PackagePath.fromString('nativeApiImplOne@1.0.0'),
            path: '/Users/foo/composite/node_modules/nativeApiImplOne',
          },
          {
            packagePath: PackagePath.fromString('nativeModuleOne@1.0.0'),
            path: '/Users/foo/composite/node_modules/nativeModuleOne',
          },
        ],
        apis: [
          {
            packagePath: PackagePath.fromString('apiOne@1.0.0'),
            path: '/Users/foo/composite/node_modules/apiOne',
          },
          {
            packagePath: PackagePath.fromString('apiOne@2.0.0'),
            path: '/Users/foo/composite/node_modules/apiOne',
          },
        ],
        nativeApisImpl: [
          {
            packagePath: PackagePath.fromString('nativeApiImplOne@1.0.0'),
            path: '/Users/foo/composite/node_modules/nativeApiImplOne',
          },
        ],
        thirdPartyInManifest: [
          {
            packagePath: PackagePath.fromString('nativeModuleOne@1.0.0'),
            path: '/Users/foo/composite/node_modules/nativeModuleOne',
          },
        ],
        thirdPartyNotInManifest: [],
      },
    ]

    const result = resolveNativeDependenciesVersions(fixture)
    expect(result.resolved).length(2)
    expect(result.pluginsWithMismatchingVersions).length(1)
    expect(result.pluginsWithMismatchingVersions).includes('apiOne')
  })

  it('should work as expected [third party native module with same version', () => {
    const fixture = [
      {
        all: [
          {
            packagePath: PackagePath.fromString('apiOne@1.0.0'),
            path: '/Users/foo/composite/node_modules/apiOne',
          },
          {
            packagePath: PackagePath.fromString('nativeApiImplOne@1.0.0'),
            path: '/Users/foo/composite/node_modules/nativeApiImplOne',
          },
          {
            packagePath: PackagePath.fromString('nativeModuleOne@1.0.0'),
            path: '/Users/foo/composite/node_modules/nativeModuleOne',
          },
          {
            packagePath: PackagePath.fromString('nativeModuleOne@1.0.0'),
            path: '/Users/foo/composite/node_modules/nativeModuleOne',
          },
        ],
        apis: [
          {
            packagePath: PackagePath.fromString('apiOne@1.0.0'),
            path: '/Users/foo/composite/node_modules/apiOne',
          },
        ],
        nativeApisImpl: [
          {
            packagePath: PackagePath.fromString('nativeApiImplOne@1.0.0'),
            path: '/Users/foo/composite/node_modules/nativeApiImplOne',
          },
        ],
        thirdPartyInManifest: [
          {
            packagePath: PackagePath.fromString('nativeModuleOne@1.0.0'),
            path: '/Users/foo/composite/node_modules/nativeModuleOne',
          },
          {
            packagePath: PackagePath.fromString('nativeModuleOne@1.0.0'),
            path: '/Users/foo/composite/node_modules/nativeModuleOne',
          },
        ],
        thirdPartyNotInManifest: [],
      },
    ]

    const result = resolveNativeDependenciesVersions(fixture)
    expect(result.resolved).length(3)
    expect(result.pluginsWithMismatchingVersions).length(0)
    const resolvedDepsAsStrings = result.resolved.map(r => r.toString())
    expect(resolvedDepsAsStrings).includes('nativeModuleOne@1.0.0')
  })

  it('should work as expected [third party native module with different patch version]', () => {
    const fixture = [
      {
        all: [
          {
            packagePath: PackagePath.fromString('apiOne@1.0.0'),
            path: '/Users/foo/composite/node_modules/apiOne',
          },
          {
            packagePath: PackagePath.fromString('nativeApiImplOne@1.0.0'),
            path: '/Users/foo/composite/node_modules/nativeApiImplOne',
          },
          {
            packagePath: PackagePath.fromString('nativeModuleOne@1.0.0'),
            path: '/Users/foo/composite/node_modules/nativeModuleOne',
          },
          {
            packagePath: PackagePath.fromString('nativeModuleOne@1.0.1'),
            path: '/Users/foo/composite/node_modules/nativeModuleOne',
          },
        ],
        apis: [
          {
            packagePath: PackagePath.fromString('apiOne@1.0.0'),
            path: '/Users/foo/composite/node_modules/apiOne',
          },
        ],
        nativeApisImpl: [
          {
            packagePath: PackagePath.fromString('nativeApiImplOne@1.0.0'),
            path: '/Users/foo/composite/node_modules/nativeApiImplOne',
          },
        ],
        thirdPartyInManifest: [
          {
            packagePath: PackagePath.fromString('nativeModuleOne@1.0.0'),
            path: '/Users/foo/composite/node_modules/nativeModuleOne',
          },
          {
            packagePath: PackagePath.fromString('nativeModuleOne@1.0.1'),
            path: '/Users/foo/composite/node_modules/nativeModuleOne',
          },
        ],
        thirdPartyNotInManifest: [],
      },
    ]

    const result = resolveNativeDependenciesVersions(fixture)
    expect(result.resolved).length(2)
    expect(result.pluginsWithMismatchingVersions).length(1)
    expect(result.pluginsWithMismatchingVersions).includes('nativeModuleOne')
  })

  it('should work as expected [third party native module with different minor version]', () => {
    const fixture = [
      {
        all: [
          {
            packagePath: PackagePath.fromString('apiOne@1.0.0'),
            path: '/Users/foo/composite/node_modules/apiOne',
          },
          {
            packagePath: PackagePath.fromString('nativeApiImplOne@1.0.0'),
            path: '/Users/foo/composite/node_modules/nativeApiImplOne',
          },
          {
            packagePath: PackagePath.fromString('nativeModuleOne@1.0.0'),
            path: '/Users/foo/composite/node_modules/nativeModuleOne',
          },
          {
            packagePath: PackagePath.fromString('nativeModuleOne@1.1.1'),
            path:
              '/Users/foo/composite/node_modules/miniappA/node_modules/nativeModuleOne',
          },
        ],
        apis: [
          {
            packagePath: PackagePath.fromString('apiOne@1.0.0'),
            path: '/Users/foo/composite/node_modules/apiOne',
          },
        ],
        nativeApisImpl: [
          {
            packagePath: PackagePath.fromString('nativeApiImplOne@1.0.0'),
            path: '/Users/foo/composite/node_modules/nativeApiImplOne',
          },
        ],
        thirdPartyInManifest: [
          {
            packagePath: PackagePath.fromString('nativeModuleOne@1.0.0'),
            path: '/Users/foo/composite/node_modules/nativeModuleOne',
          },
          {
            packagePath: PackagePath.fromString('nativeModuleOne@1.1.1'),
            path:
              '/Users/foo/composite/node_modules/miniappA/node_modules/nativeModuleOne',
          },
        ],
        thirdPartyNotInManifest: [],
      },
    ]

    const result = resolveNativeDependenciesVersions(fixture)
    expect(result.resolved).length(2)
    expect(result.pluginsWithMismatchingVersions).length(1)
    expect(result.pluginsWithMismatchingVersions).includes('nativeModuleOne')
  })

  it('should work as expected [third party native module with different major version]', () => {
    const fixture = [
      {
        all: [
          {
            packagePath: PackagePath.fromString('apiOne@1.0.0'),
            path: '/Users/foo/composite/node_modules/apiOne',
          },
          {
            packagePath: PackagePath.fromString('nativeApiImplOne@1.0.0'),
            path: '/Users/foo/composite/node_modules/nativeApiImplOne',
          },
          {
            packagePath: PackagePath.fromString('nativeModuleOne@1.0.0'),
            path: '/Users/foo/composite/node_modules/nativeModuleOne',
          },
          {
            packagePath: PackagePath.fromString('nativeModuleOne@2.0.0'),
            path:
              '/Users/foo/composite/node_modules/miniappA/node_modules/nativeModuleOne',
          },
        ],
        apis: [
          {
            packagePath: PackagePath.fromString('apiOne@1.0.0'),
            path: '/Users/foo/composite/node_modules/apiOne',
          },
        ],
        nativeApisImpl: [
          {
            packagePath: PackagePath.fromString('nativeApiImplOne@1.0.0'),
            path: '/Users/foo/composite/node_modules/nativeApiImplOne',
          },
        ],
        thirdPartyInManifest: [
          {
            packagePath: PackagePath.fromString('nativeModuleOne@1.0.0'),
            path: '/Users/foo/composite/node_modules/nativeModuleOne',
          },
          {
            packagePath: PackagePath.fromString('nativeModuleOne@2.0.0'),
            path:
              '/Users/foo/composite/node_modules/miniappA/node_modules/nativeModuleOne',
          },
        ],
        thirdPartyNotInManifest: [],
      },
    ]

    const result = resolveNativeDependenciesVersions(fixture)
    expect(result.resolved).length(2)
    expect(result.pluginsWithMismatchingVersions).length(1)
    expect(result.pluginsWithMismatchingVersions).includes('nativeModuleOne')
  })
})
