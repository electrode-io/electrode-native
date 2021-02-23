import { AndroidPluginConfigGenerator } from '../src/AndroidPluginConfigGenerator';
import path from 'path';
import { expect } from 'chai';

describe('AndroidPluginConfigGenerator', () => {
  const fixturesPath = path.join(
    __dirname,
    'fixtures/PluginConfigGenerator/android',
  );

  const dependenciesFixturePath = path.join(fixturesPath, 'dependencies');
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
        "implementation 'com.android.support:support-v4:28.0.0'",
        "annotationProcessor 'com.example:annotation-processor:1.0.0'",
        "api 'com.example:api:1.0.0'",
        "compileOnly 'com.example:compile-only:1.0.0'",
        "implementation 'com.example:aar-dep:1.0.0'", // gradle-to-js currently does not support closure blocks and artifact type selectors (@aar)
      ]);
    });
  });
});
