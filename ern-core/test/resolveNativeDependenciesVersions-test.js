// @flow

import {
  expect
} from 'chai'
import type { NativeDependencies } from '../src/nativeDependenciesLookup'
import PackagePath from '../src/PackagePath'
import * as nativeDepenciesVersionResolution from '../src/resolveNativeDependenciesVersions'

// ==========================================================
// retainHighestVersions
// ==========================================================
describe('retainHighestVersion', () => {
  it('should work as expected', () => {
    const arrA = [
      PackagePath.fromString('dependencyA@1.0.0'),
      PackagePath.fromString('dependencyB@2.0.1'),
      PackagePath.fromString('dependencyC@1.0.0'),
      PackagePath.fromString('dependencyD@1.0.0')
    ]

    const arrB = [
      PackagePath.fromString('dependencyA@2.0.0'),
      PackagePath.fromString('dependencyB@2.0.0'),
      PackagePath.fromString('dependencyC@1.1.0'),
      PackagePath.fromString('dependencyE@1.0.0'),
      PackagePath.fromString('dependencyF@3.0.0')
    ]

    const result = nativeDepenciesVersionResolution.retainHighestVersions(arrA, arrB)
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
    const fixture = [ 
      {
        apis: [ PackagePath.fromString('apiOne@1.0.0'), PackagePath.fromString('apiTwo@1.0.0') ],
        nativeApisImpl: [ PackagePath.fromString('nativeApiImplOne@1.0.0') ],
        thirdPartyInManifest: [ PackagePath.fromString('nativeModuleOne@1.0.0') ]
      }
    ]

    const result = nativeDepenciesVersionResolution.resolveNativeDependenciesVersions(fixture)
    expect(result.resolved).length(4)
    expect(result.pluginsWithMismatchingVersions).empty
  })

  it('should work as expected [same api with different patch version]', () => {
    const fixture = [ 
      {
        apis: [ PackagePath.fromString('apiOne@1.0.0'), PackagePath.fromString('apiOne@1.0.1') ],
        nativeApisImpl: [ PackagePath.fromString('nativeApiImplOne@1.0.0') ],
        thirdPartyInManifest: [ PackagePath.fromString('nativeModuleOne@1.0.0') ]
      }
    ]

    const result = nativeDepenciesVersionResolution.resolveNativeDependenciesVersions(fixture)
    expect(result.resolved).length(3)
    expect(result.pluginsWithMismatchingVersions).empty
    const resolvedDepsAsStrings = result.resolved.map(r => r.toString())
    expect(resolvedDepsAsStrings).includes('apiOne@1.0.1')
  })

  it('should work as expected [same api with different minor version]', () => {
    const fixture = [ 
      {
        apis: [ PackagePath.fromString('apiOne@1.0.0'), PackagePath.fromString('apiOne@1.1.0') ],
        nativeApisImpl: [ PackagePath.fromString('nativeApiImplOne@1.0.0') ],
        thirdPartyInManifest: [ PackagePath.fromString('nativeModuleOne@1.0.0') ]
      }
    ]

    const result = nativeDepenciesVersionResolution.resolveNativeDependenciesVersions(fixture)
    expect(result.resolved).length(3)
    expect(result.pluginsWithMismatchingVersions).empty
    const resolvedDepsAsStrings = result.resolved.map(r => r.toString())
    expect(resolvedDepsAsStrings).includes('apiOne@1.1.0')
  })

  it('should work as expected [same api with same version]', () => {
    const fixture = [ 
      {
        apis: [ PackagePath.fromString('apiOne@1.0.0'), PackagePath.fromString('apiOne@1.0.0') ],
        nativeApisImpl: [ PackagePath.fromString('nativeApiImplOne@1.0.0') ],
        thirdPartyInManifest: [ PackagePath.fromString('nativeModuleOne@1.0.0') ]
      }
    ]

    const result = nativeDepenciesVersionResolution.resolveNativeDependenciesVersions(fixture)
    expect(result.resolved).length(3)
  })

  it('should work as expected [same api with different major version]', () => {
    const fixture = [ 
      {
        apis: [ PackagePath.fromString('apiOne@1.0.0'), PackagePath.fromString('apiOne@2.0.0') ],
        nativeApisImpl: [ PackagePath.fromString('nativeApiImplOne@1.0.0') ],
        thirdPartyInManifest: [ PackagePath.fromString('nativeModuleOne@1.0.0') ]
      }
    ]

    const result = nativeDepenciesVersionResolution.resolveNativeDependenciesVersions(fixture)
    expect(result.resolved).length(2)
    expect(result.pluginsWithMismatchingVersions).length(1)
    expect(result.pluginsWithMismatchingVersions).includes('apiOne')
  })

  it('should work as expected [react-native-electrode-bridge same version]', () => {
    const fixture = [ 
      {
        apis: [ PackagePath.fromString('apiOne@1.0.0') ],
        nativeApisImpl: [ PackagePath.fromString('nativeApiImplOne@1.0.0') ],
        thirdPartyInManifest: [
          PackagePath.fromString('react-native-electrode-bridge@1.0.0'), 
          PackagePath.fromString('react-native-electrode-bridge@1.0.0')
        ]
      }
    ]

    const result = nativeDepenciesVersionResolution.resolveNativeDependenciesVersions(fixture)
    expect(result.resolved).length(3)
    expect(result.pluginsWithMismatchingVersions).length(0)
  })

  it('should work as expected [react-native-electrode-bridge with different patch version]', () => {
    const fixture = [ 
      {
        apis: [ PackagePath.fromString('apiOne@1.0.0') ],
        nativeApisImpl: [ PackagePath.fromString('nativeApiImplOne@1.0.0') ],
        thirdPartyInManifest: [
          PackagePath.fromString('react-native-electrode-bridge@1.0.0'), 
          PackagePath.fromString('react-native-electrode-bridge@1.0.1')
        ]
      }
    ]

    const result = nativeDepenciesVersionResolution.resolveNativeDependenciesVersions(fixture)
    expect(result.resolved).length(3)
    expect(result.pluginsWithMismatchingVersions).length(0)
    const resolvedDepsAsStrings = result.resolved.map(r => r.toString())
    expect(resolvedDepsAsStrings).includes('react-native-electrode-bridge@1.0.1')
  })

  it('should work as expected [react-native-electrode-bridge with different minor version]', () => {
    const fixture = [ 
      {
        apis: [ PackagePath.fromString('apiOne@1.0.0') ],
        nativeApisImpl: [ PackagePath.fromString('nativeApiImplOne@1.0.0') ],
        thirdPartyInManifest: [
          PackagePath.fromString('react-native-electrode-bridge@1.0.0'), 
          PackagePath.fromString('react-native-electrode-bridge@1.1.0')
        ]
      }
    ]

    const result = nativeDepenciesVersionResolution.resolveNativeDependenciesVersions(fixture)
    expect(result.resolved).length(3)
    expect(result.pluginsWithMismatchingVersions).length(0)
    const resolvedDepsAsStrings = result.resolved.map(r => r.toString())
    expect(resolvedDepsAsStrings).includes('react-native-electrode-bridge@1.1.0')
  })

  it('should work as expected [react-native-electrode-bridge with different major version]', () => {
    const fixture = [ 
      {
        apis: [ PackagePath.fromString('apiOne@1.0.0') ],
        nativeApisImpl: [ PackagePath.fromString('nativeApiImplOne@1.0.0') ],
        thirdPartyInManifest: [
          PackagePath.fromString('react-native-electrode-bridge@1.0.0'), 
          PackagePath.fromString('react-native-electrode-bridge@2.0.0')
        ]
      }
    ]

    const result = nativeDepenciesVersionResolution.resolveNativeDependenciesVersions(fixture)
    expect(result.resolved).length(2)
    expect(result.pluginsWithMismatchingVersions).length(1)
    expect(result.pluginsWithMismatchingVersions).includes('react-native-electrode-bridge')
  })

  it('should work as expected [third party native module with same version', () => {
    const fixture = [ 
      {
        apis: [ PackagePath.fromString('apiOne@1.0.0') ],
        nativeApisImpl: [ PackagePath.fromString('nativeApiImplOne@1.0.0') ],
        thirdPartyInManifest: [
          PackagePath.fromString('nativeModuleOne@1.0.0'), 
          PackagePath.fromString('nativeModuleOne@1.0.0')
        ]
      }
    ]

    const result = nativeDepenciesVersionResolution.resolveNativeDependenciesVersions(fixture)
    expect(result.resolved).length(3)
    expect(result.pluginsWithMismatchingVersions).length(0)
    const resolvedDepsAsStrings = result.resolved.map(r => r.toString())
    expect(resolvedDepsAsStrings).includes('nativeModuleOne@1.0.0')
  })

  it('should work as expected [third party native module with different patch version]', () => {
    const fixture = [ 
      {
        apis: [ PackagePath.fromString('apiOne@1.0.0') ],
        nativeApisImpl: [ PackagePath.fromString('nativeApiImplOne@1.0.0') ],
        thirdPartyInManifest: [
          PackagePath.fromString('nativeModuleOne@1.0.0'), 
          PackagePath.fromString('nativeModuleOne@1.0.1')
        ]
      }
    ]

    const result = nativeDepenciesVersionResolution.resolveNativeDependenciesVersions(fixture)
    expect(result.resolved).length(2)
    expect(result.pluginsWithMismatchingVersions).length(1)
    expect(result.pluginsWithMismatchingVersions).includes('nativeModuleOne')
  })

  it('should work as expected [third party native module with different minor version]', () => {
    const fixture = [ 
      {
        apis: [ PackagePath.fromString('apiOne@1.0.0') ],
        nativeApisImpl: [ PackagePath.fromString('nativeApiImplOne@1.0.0') ],
        thirdPartyInManifest: [
          PackagePath.fromString('nativeModuleOne@1.0.0'), 
          PackagePath.fromString('nativeModuleOne@1.1.0')
        ]
      }
    ]

    const result = nativeDepenciesVersionResolution.resolveNativeDependenciesVersions(fixture)
    expect(result.resolved).length(2)
    expect(result.pluginsWithMismatchingVersions).length(1)
    expect(result.pluginsWithMismatchingVersions).includes('nativeModuleOne')
  })

  it('should work as expected [third party native module with different major version]', () => {
    const fixture = [ 
      {
        apis: [ PackagePath.fromString('apiOne@1.0.0') ],
        nativeApisImpl: [ PackagePath.fromString('nativeApiImplOne@1.0.0') ],
        thirdPartyInManifest: [
          PackagePath.fromString('nativeModuleOne@1.0.0'), 
          PackagePath.fromString('nativeModuleOne@2.0.0')
        ]
      }
    ]

    const result = nativeDepenciesVersionResolution.resolveNativeDependenciesVersions(fixture)
    expect(result.resolved).length(2)
    expect(result.pluginsWithMismatchingVersions).length(1)
    expect(result.pluginsWithMismatchingVersions).includes('nativeModuleOne')
  })
})