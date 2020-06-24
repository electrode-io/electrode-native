import { AndroidPluginConfigGenerator } from '../src/AndroidPluginConfigGenerator';
import path from 'path';
import { expect } from 'chai';

describe('AndroidPluginConfigGenerator', () => {
  const fixutresPath = path.join(
    __dirname,
    'fixtures/PluginConfigGenerator/android',
  );

  const dependenciesFixturePath = path.join(fixutresPath, 'dependencies');
  const dependenciesBuildGradlePath = path.join(
    dependenciesFixturePath,
    'build.gradle',
  );

  describe('getDependenciesFromBuildGradle', () => {
    it('should get dependencies', async () => {
      const sut = AndroidPluginConfigGenerator.fromPath(
        dependenciesFixturePath,
      );
      const dependencies = await sut.getDependenciesFromBuildGradle(
        dependenciesBuildGradlePath,
        () => Promise.resolve('1.0.0'),
      );
      expect(dependencies).deep.equal([
        'com.google.zxing:core:3.3.3',
        'com.drewnoakes:metadata-extractor:2.11.0',
        'com.android.support:exifinterface:28.0.0',
        'com.android.support:support-annotations:28.0.0',
        'com.android.support:support-v4:28.0.0',
      ]);
    });
  });
});
