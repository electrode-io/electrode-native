import { AndroidPluginConfigGenerator } from '../src/AndroidPluginConfigGenerator';
import path from 'path';
import { expect } from 'chai';
import fs from 'fs-extra';

const fixturesPath = path.join(
  __dirname,
  'fixtures/PluginConfigGenerator/android',
);

async function getFixture(file: string) {
  return (await fs.readFile(path.join(fixturesPath, file))).toString();
}

describe('AndroidPluginConfigGenerator', () => {
  const sut = AndroidPluginConfigGenerator.fromPath(fixturesPath);

  describe('getDependenciesFromBuildGradle', () => {
    it('should get dependencies', async () => {
      const dependencies = await sut.getDependenciesFromBuildGradle(
        path.join(fixturesPath, 'build.gradle'),
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

  describe('getPackageDeclarationFromSource', () => {
    it('should return null if not found', async () => {
      expect(sut.getPackageDeclarationFromSource('no package')).to.be.null;
    });

    it('should return package name from Java source', () => {
      const source = 'package com.example;';
      expect(sut.getPackageDeclarationFromSource(source)).to.equal(
        'com.example',
      );
    });

    it('should return package name from Kotlin source', () => {
      const source = 'package com.example';
      expect(sut.getPackageDeclarationFromSource(source)).to.equal(
        'com.example',
      );
    });
  });

  describe('getClassNameFromSource', () => {
    it('should return null if not found', async () => {
      expect(sut.getClassNameFromSource('no class name')).to.be.null;
    });
    for (const t of [
      {
        source: 'public class TestPackage implements ReactPackage',
        type: 'Java source',
      },
      {
        source: 'class TestPackage : ReactPackage',
        type: 'Kotlin source (standard formatting)',
      },
      {
        source: 'class TestPackage:ReactPackage',
        type: 'Kotlin source (no space)',
      },
      {
        source: 'class TestPackage(test: String) : ReactPackage',
        type: 'Kotlin source (with primary constructor)',
      },
      {
        source: 'class TestPackage(test:String):ReactPackage',
        type: 'Kotlin source (with primary constructor, no space)',
      },
    ]) {
      it(`should detect class name in ${t.type}`, async () => {
        expect(sut.getClassNameFromSource(t.source)).to.equal('TestPackage');
      });
    }
  });

  describe('hasNoArgumentConstructor', () => {
    for (const t of [
      { className: 'TestPackage', type: 'java', expected: false },
      { className: 'TestNoArgCtorPackage', type: 'java', expected: true },
      { className: 'TestCustomCtorPackage', type: 'java', expected: false },
      { className: 'TestPackage', type: 'kt', expected: false },
      { className: 'TestNoArgCtorPackage', type: 'kt', expected: true },
      { className: 'TestCustomCtorPackage', type: 'kt', expected: false },
      { className: 'TestPrimaryCtorPackage', type: 'kt', expected: false },
    ]) {
      it(`should detect constructor in ${t.type} source [${t.className}]`, async () => {
        const src = await getFixture(`${t.className}.${t.type}`);
        expect(sut.hasNoArgumentConstructor(src, t.className)).to.eq(
          t.expected,
        );
      });
    }
  });

  describe('hasNonDefaultConstructor', () => {
    for (const t of [
      { className: 'TestPackage', type: 'java', expected: false },
      { className: 'TestNoArgCtorPackage', type: 'java', expected: false },
      { className: 'TestCustomCtorPackage', type: 'java', expected: true },
      { className: 'TestPackage', type: 'kt', expected: false },
      { className: 'TestNoArgCtorPackage', type: 'kt', expected: false },
      { className: 'TestCustomCtorPackage', type: 'kt', expected: true },
      { className: 'TestPrimaryCtorPackage', type: 'kt', expected: true },
    ]) {
      it(`should detect custom constructor in ${t.type} source [${t.className}]`, async () => {
        const src = await getFixture(`${t.className}.${t.type}`);
        expect(sut.hasCustomConstructors(src, t.className)).to.eq(t.expected);
      });
    }
  });
});
