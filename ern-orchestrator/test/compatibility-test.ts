import { expect } from 'chai';
import { PackagePath } from 'ern-core';
import { getCompatibility } from '../src/compatibility';

describe('compatibility', () => {
  describe('getCompatibility', () => {
    it('should return exact same dependencies versions as compatible', () => {
      const result = getCompatibility(
        /* local */ [PackagePath.fromString('depA@1.0.0')],
        /* remote */ [PackagePath.fromString('depA@1.0.0')],
      );
      expect(result).not.undefined;
      expect(result.compatible).is.an('array').of.length(1);
    });

    it('should return different dependencies versions as incompatible', () => {
      const result = getCompatibility(
        /* local */ [PackagePath.fromString('depA@1.0.0')],
        /* remote */ [PackagePath.fromString('depA@2.0.0')],
      );
      expect(result).not.undefined;
      expect(result.incompatible).is.an('array').of.length(1);
    });

    it('should return incompatible for bridge if version major differs', () => {
      const result = getCompatibility(
        /* local */ [
          PackagePath.fromString('react-native-electrode-bridge@1.0.0'),
        ],
        /* remote */ [
          PackagePath.fromString('react-native-electrode-bridge@2.0.0'),
        ],
      );
      expect(result).not.undefined;
      expect(result.incompatible).is.an('array').of.length(1);
    });

    it('should return compatible non strict for bridge if version differs and local version < remote version ', () => {
      const result = getCompatibility(
        /* local */ [
          PackagePath.fromString('react-native-electrode-bridge@1.0.0'),
        ],
        /* remote */ [
          PackagePath.fromString('react-native-electrode-bridge@1.1.0'),
        ],
      );
      expect(result).not.undefined;
      expect(result.compatibleNonStrict).is.an('array').of.length(1);
    });

    it('should return incompatible for bridge if version differs and local version > remote version ', () => {
      const result = getCompatibility(
        /* local */ [
          PackagePath.fromString('react-native-electrode-bridge@1.1.0'),
        ],
        /* remote */ [
          PackagePath.fromString('react-native-electrode-bridge@1.0.0'),
        ],
      );
      expect(result).not.undefined;
      expect(result.incompatible).is.an('array').of.length(1);
    });
  });

  it('should return incompatible for bridge if version major differs', () => {
    const result = getCompatibility(
      /* local */ [
        PackagePath.fromString('react-native-electrode-bridge@1.0.0'),
      ],
      /* remote */ [
        PackagePath.fromString('react-native-electrode-bridge@2.0.0'),
      ],
    );
    expect(result).not.undefined;
    expect(result.incompatible).is.an('array').of.length(1);
  });

  it('should return compatible non strict for bridge if version differs and local version < remote version ', () => {
    const result = getCompatibility(
      /* local */ [
        PackagePath.fromString('react-native-electrode-bridge@1.0.0'),
      ],
      /* remote */ [
        PackagePath.fromString('react-native-electrode-bridge@1.1.0'),
      ],
    );
    expect(result).not.undefined;
    expect(result.compatibleNonStrict).is.an('array').of.length(1);
  });

  it('should return incompatible for bridge if version differs and local version > remote version ', () => {
    const result = getCompatibility(
      /* local */ [
        PackagePath.fromString('react-native-electrode-bridge@1.1.0'),
      ],
      /* remote */ [
        PackagePath.fromString('react-native-electrode-bridge@1.0.0'),
      ],
    );
    expect(result).not.undefined;
    expect(result.incompatible).is.an('array').of.length(1);
  });

  it('should return incompatible for api if version major differs', () => {
    const result = getCompatibility(
      /* local */ [PackagePath.fromString('react-native-my-api@1.0.0')],
      /* remote */ [PackagePath.fromString('react-native-my-api@2.0.0')],
    );
    expect(result).not.undefined;
    expect(result.incompatible).is.an('array').of.length(1);
  });

  it('should return compatible non strict for api if version differs and local version < remote version ', () => {
    const result = getCompatibility(
      /* local */ [PackagePath.fromString('react-native-my-api@1.0.0')],
      /* remote */ [PackagePath.fromString('react-native-my-api@1.1.0')],
    );
    expect(result).not.undefined;
    expect(result.compatibleNonStrict).is.an('array').of.length(1);
  });

  it('should return incompatible for api if version differs and local version > remote version ', () => {
    const result = getCompatibility(
      /* local */ [PackagePath.fromString('react-native-my-api@1.1.0')],
      /* remote */ [PackagePath.fromString('react-native-my-api@1.0.0')],
    );
    expect(result).not.undefined;
    expect(result.incompatible).is.an('array').of.length(1);
  });

  it('should return incompatible for api impl if version major differs', () => {
    const result = getCompatibility(
      /* local */ [PackagePath.fromString('react-native-my-api-impl@1.0.0')],
      /* remote */ [PackagePath.fromString('react-native-my-api-impl@2.0.0')],
    );
    expect(result).not.undefined;
    expect(result.incompatible).is.an('array').of.length(1);
  });

  it('should return compatible non strict for api impl if version differs and local version < remote version ', () => {
    const result = getCompatibility(
      /* local */ [PackagePath.fromString('react-native-my-api-impl@1.0.0')],
      /* remote */ [PackagePath.fromString('react-native-my-api-impl@1.1.0')],
    );
    expect(result).not.undefined;
    expect(result.compatibleNonStrict).is.an('array').of.length(1);
  });

  it('should return incompatible for api impl if version differs and local version > remote version ', () => {
    const result = getCompatibility(
      /* local */ [PackagePath.fromString('react-native-my-api-impl@1.1.0')],
      /* remote */ [PackagePath.fromString('react-native-my-api-impl@1.0.0')],
    );
    expect(result).not.undefined;
    expect(result.incompatible).is.an('array').of.length(1);
  });

  it('should return incompatible if remote dep is missing and flag is set', () => {
    const result = getCompatibility(
      /* local */ [PackagePath.fromString('depA@1.0.0')],
      /* remote */ [],
      { uncompatibleIfARemoteDepIsMissing: true },
    );
    expect(result).not.undefined;
    expect(result.incompatible).is.an('array').of.length(1);
  });
});
