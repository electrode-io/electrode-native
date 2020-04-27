import { expect } from 'chai';
import { NativeDependencies } from '../src/nativeDependenciesLookup';
import { PackagePath } from '../src/PackagePath';
import {
  containsVersionMismatch,
  resolveNativeDependenciesVersions,
  retainHighestVersions,
} from '../src/resolveNativeDependenciesVersions';

// ==========================================================
// containsVersionMismatch
// ==========================================================
describe('containsVersionMismatch', () => {
  [
    [['1.0.0', '2.0.0', '1.0.0'], 'major', true],
    [['1.0.0', '2.0.0', '1.0.0'], 'minor', true],
    [['1.0.0', '2.0.0', '1.0.0'], 'patch', true],
    [['1.0.0', '1.1.0', '1.0.0'], 'major', false],
    [['1.0.0', '1.1.0', '1.0.0'], 'minor', true],
    [['1.0.0', '1.1.0', '1.0.0'], 'patch', true],
    [['1.0.0', '1.0.1', '1.0.0'], 'major', false],
    [['1.0.0', '1.0.1', '1.0.0'], 'minor', false],
    [['1.0.0', '1.0.1', '1.0.0'], 'patch', true],
    [['1.0.0-beta.1', '1.0.0-beta.2', '1.0.0-beta.1'], 'major', true],
    [['1.0.0-beta.1', '1.0.0-beta.2', '1.0.0-beta.1'], 'minor', true],
    [['1.0.0-beta.1', '1.0.0-beta.2', '1.0.0-beta.1'], 'patch', true],
    [['1.0.0-beta.1', '1.0.0-beta.1', '1.0.0-beta.1'], 'major', false],
    [['1.0.0-beta.1', '1.0.0-beta.1', '1.0.0-beta.1'], 'minor', false],
    [['1.0.0-beta.1', '1.0.0-beta.1', '1.0.0-beta.1'], 'patch', false],
    [['1.0.0', '1.0.0-beta.1'], 'major', true],
    [['1.0.0', '1.0.0-beta.1'], 'minor', true],
    [['1.0.0', '1.0.0-beta.1'], 'patch', true],
  ].forEach(
    ([versions, mismatchLevel, expected]: [
      string[],
      'major' | 'minor' | 'patch',
      boolean,
    ]) => {
      it(`should return ${expected} for versions ${JSON.stringify(
        versions,
      )} using '${mismatchLevel}' mismatchLevel `, () => {
        expect(containsVersionMismatch(versions, mismatchLevel)).equal(
          expected,
        );
      });
    },
  );
});

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
    ];

    const arrB = [
      PackagePath.fromString('dependencyA@2.0.0'),
      PackagePath.fromString('dependencyB@2.0.0'),
      PackagePath.fromString('dependencyC@1.1.0'),
      PackagePath.fromString('dependencyE@1.0.0'),
      PackagePath.fromString('dependencyF@3.0.0'),
    ];

    const result = retainHighestVersions(arrA, arrB);
    const stringifedResult = result.map(p => p.toString());
    expect(stringifedResult).length(6);
    expect(stringifedResult).includes('dependencyA@2.0.0');
    expect(stringifedResult).includes('dependencyB@2.0.1');
    expect(stringifedResult).includes('dependencyC@1.1.0');
    expect(stringifedResult).includes('dependencyD@1.0.0');
    expect(stringifedResult).includes('dependencyE@1.0.0');
    expect(stringifedResult).includes('dependencyF@3.0.0');
  });
});

// ==========================================================
// resolveNativeDependenciesVersions
// ==========================================================
describe('resolveNativeDependenciesVersions', () => {
  it('should work as expected [different native dependencies]', () => {
    const fixture: NativeDependencies[] = [
      {
        all: [
          PackagePath.fromString('apiOne@1.0.0'),
          PackagePath.fromString('apiTwo@1.0.0'),
          PackagePath.fromString('nativeApiImplOne@1.0.0'),
          PackagePath.fromString('nativeModuleOne@1.0.0'),
        ],
        apis: [
          PackagePath.fromString('apiOne@1.0.0'),
          PackagePath.fromString('apiTwo@1.0.0'),
        ],
        nativeApisImpl: [PackagePath.fromString('nativeApiImplOne@1.0.0')],
        thirdPartyInManifest: [PackagePath.fromString('nativeModuleOne@1.0.0')],
        thirdPartyNotInManifest: [],
      },
    ];

    const result = resolveNativeDependenciesVersions(fixture);
    expect(result.resolved).length(4);
    expect(result.pluginsWithMismatchingVersions).empty;
  });

  it('should work as expected [same api with different patch version]', () => {
    const fixture: NativeDependencies[] = [
      {
        all: [
          PackagePath.fromString('apiOne@1.0.0'),
          PackagePath.fromString('apiOne@1.0.1'),
          PackagePath.fromString('nativeApiImplOne@1.0.0'),
          PackagePath.fromString('nativeModuleOne@1.0.0'),
        ],
        apis: [
          PackagePath.fromString('apiOne@1.0.0'),
          PackagePath.fromString('apiOne@1.0.1'),
        ],
        nativeApisImpl: [PackagePath.fromString('nativeApiImplOne@1.0.0')],
        thirdPartyInManifest: [PackagePath.fromString('nativeModuleOne@1.0.0')],
        thirdPartyNotInManifest: [],
      },
    ];

    const result = resolveNativeDependenciesVersions(fixture);
    expect(result.resolved).length(3);
    expect(result.pluginsWithMismatchingVersions).empty;
    const resolvedDepsAsStrings = result.resolved.map((r: any) => r.toString());
    expect(resolvedDepsAsStrings).includes('apiOne@1.0.1');
  });

  it('should work as expected [same api with different minor version]', () => {
    const fixture = [
      {
        all: [
          PackagePath.fromString('apiOne@1.0.0'),
          PackagePath.fromString('apiOne@1.1.0'),
          PackagePath.fromString('nativeApiImplOne@1.0.0'),
          PackagePath.fromString('nativeModuleOne@1.0.0'),
        ],
        apis: [
          PackagePath.fromString('apiOne@1.0.0'),
          PackagePath.fromString('apiOne@1.1.0'),
        ],
        nativeApisImpl: [PackagePath.fromString('nativeApiImplOne@1.0.0')],
        thirdPartyInManifest: [PackagePath.fromString('nativeModuleOne@1.0.0')],
        thirdPartyNotInManifest: [],
      },
    ];

    const result = resolveNativeDependenciesVersions(fixture);
    expect(result.resolved).length(3);
    expect(result.pluginsWithMismatchingVersions).empty;
    const resolvedDepsAsStrings = result.resolved.map((r: any) => r.toString());
    expect(resolvedDepsAsStrings).includes('apiOne@1.1.0');
  });

  it('should work as expected [same api with same version]', () => {
    const fixture = [
      {
        all: [
          PackagePath.fromString('apiOne@1.0.0'),
          PackagePath.fromString('apiOne@1.0.0'),
          PackagePath.fromString('nativeApiImplOne@1.0.0'),
          PackagePath.fromString('nativeModuleOne@1.0.0'),
        ],
        apis: [
          PackagePath.fromString('apiOne@1.0.0'),
          PackagePath.fromString('apiOne@1.0.0'),
        ],
        nativeApisImpl: [PackagePath.fromString('nativeApiImplOne@1.0.0')],
        thirdPartyInManifest: [PackagePath.fromString('nativeModuleOne@1.0.0')],
        thirdPartyNotInManifest: [],
      },
    ];

    const result = resolveNativeDependenciesVersions(fixture);
    expect(result.resolved).length(3);
  });

  it('should work as expected [same api with different major version]', () => {
    const fixture = [
      {
        all: [
          PackagePath.fromString('apiOne@1.0.0'),
          PackagePath.fromString('apiOne@2.0.0'),
          PackagePath.fromString('nativeApiImplOne@1.0.0'),
          PackagePath.fromString('nativeModuleOne@1.0.0'),
        ],
        apis: [
          PackagePath.fromString('apiOne@1.0.0'),
          PackagePath.fromString('apiOne@2.0.0'),
        ],
        nativeApisImpl: [PackagePath.fromString('nativeApiImplOne@1.0.0')],
        thirdPartyInManifest: [PackagePath.fromString('nativeModuleOne@1.0.0')],
        thirdPartyNotInManifest: [],
      },
    ];

    const result = resolveNativeDependenciesVersions(fixture);
    expect(result.resolved).length(2);
    expect(result.pluginsWithMismatchingVersions).length(1);
    expect(result.pluginsWithMismatchingVersions).includes('apiOne');
  });

  it('should work as expected [third party native module with same version', () => {
    const fixture = [
      {
        all: [
          PackagePath.fromString('apiOne@1.0.0'),
          PackagePath.fromString('nativeApiImplOne@1.0.0'),
          PackagePath.fromString('nativeModuleOne@1.0.0'),
          PackagePath.fromString('nativeModuleOne@1.0.0'),
        ],
        apis: [PackagePath.fromString('apiOne@1.0.0')],
        nativeApisImpl: [PackagePath.fromString('nativeApiImplOne@1.0.0')],
        thirdPartyInManifest: [
          PackagePath.fromString('nativeModuleOne@1.0.0'),
          PackagePath.fromString('nativeModuleOne@1.0.0'),
        ],
        thirdPartyNotInManifest: [],
      },
    ];

    const result = resolveNativeDependenciesVersions(fixture);
    expect(result.resolved).length(3);
    expect(result.pluginsWithMismatchingVersions).length(0);
    const resolvedDepsAsStrings = result.resolved.map((r: any) => r.toString());
    expect(resolvedDepsAsStrings).includes('nativeModuleOne@1.0.0');
  });

  it('should work as expected [third party native module with different patch version]', () => {
    const fixture = [
      {
        all: [
          PackagePath.fromString('apiOne@1.0.0'),
          PackagePath.fromString('nativeApiImplOne@1.0.0'),
          PackagePath.fromString('nativeModuleOne@1.0.0'),
          PackagePath.fromString('nativeModuleOne@1.0.1'),
        ],
        apis: [PackagePath.fromString('apiOne@1.0.0')],
        nativeApisImpl: [PackagePath.fromString('nativeApiImplOne@1.0.0')],
        thirdPartyInManifest: [
          PackagePath.fromString('nativeModuleOne@1.0.0'),
          PackagePath.fromString('nativeModuleOne@1.0.1'),
        ],
        thirdPartyNotInManifest: [],
      },
    ];

    const result = resolveNativeDependenciesVersions(fixture);
    expect(result.resolved).length(2);
    expect(result.pluginsWithMismatchingVersions).length(1);
    expect(result.pluginsWithMismatchingVersions).includes('nativeModuleOne');
  });

  it('should work as expected [third party native module with different minor version]', () => {
    const fixture = [
      {
        all: [
          PackagePath.fromString('apiOne@1.0.0'),
          PackagePath.fromString('nativeApiImplOne@1.0.0'),
          PackagePath.fromString('nativeModuleOne@1.0.0'),
          PackagePath.fromString('nativeModuleOne@1.1.0'),
        ],
        apis: [PackagePath.fromString('apiOne@1.0.0')],
        nativeApisImpl: [PackagePath.fromString('nativeApiImplOne@1.0.0')],
        thirdPartyInManifest: [
          PackagePath.fromString('nativeModuleOne@1.0.0'),
          PackagePath.fromString('nativeModuleOne@1.1.0'),
        ],
        thirdPartyNotInManifest: [],
      },
    ];

    const result = resolveNativeDependenciesVersions(fixture);
    expect(result.resolved).length(2);
    expect(result.pluginsWithMismatchingVersions).length(1);
    expect(result.pluginsWithMismatchingVersions).includes('nativeModuleOne');
  });

  it('should work as expected [third party native module with different major version]', () => {
    const fixture = [
      {
        all: [
          PackagePath.fromString('apiOne@1.0.0'),
          PackagePath.fromString('nativeApiImplOne@1.0.0'),
          PackagePath.fromString('nativeModuleOne@1.0.0'),
          PackagePath.fromString('nativeModuleOne@2.0.0'),
        ],
        apis: [PackagePath.fromString('apiOne@1.0.0')],
        nativeApisImpl: [PackagePath.fromString('nativeApiImplOne@1.0.0')],
        thirdPartyInManifest: [
          PackagePath.fromString('nativeModuleOne@1.0.0'),
          PackagePath.fromString('nativeModuleOne@2.0.0'),
        ],
        thirdPartyNotInManifest: [],
      },
    ];

    const result = resolveNativeDependenciesVersions(fixture);
    expect(result.resolved).length(2);
    expect(result.pluginsWithMismatchingVersions).length(1);
    expect(result.pluginsWithMismatchingVersions).includes('nativeModuleOne');
  });
});
