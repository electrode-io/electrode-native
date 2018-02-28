// @flow
import type {
  ContainerPublisher,
  ContainerPublisherConfig
} from '../FlowTypes'
import {
  shell,
  mustacheUtils,
  childProcess
} from 'ern-core'
import fs from 'fs'
import path from 'path'
import tmp from 'tmp'
const {
  execp
} = childProcess

export default class JcenterPublisher implements ContainerPublisher {
  get name (): string {
    return 'jcenter'
  }
  async publish (config: ContainerPublisherConfig): any {
    if (!config.extra) {
      config.extra = {}
    }

    if (!config.extra.artifactId) {
      config.extra.artifactId = 'local-container'
    }

    if (!config.extra.groupId) {
      config.extra.groupId = 'com.walmartlabs.ern'
    }

    const mustacheConfig = {}

    mustacheConfig.artifactId = config.extra.artifactId
    mustacheConfig.groupId = config.extra.groupId
    mustacheConfig.containerVersion = config.containerVersion

    const workingDir = tmp.dirSync({
      unsafeCleanup: true
    }).name
    shell.cp('-Rf', path.join(config.containerPath, '{.*,*}'), workingDir)

    fs.appendFileSync(path.join(workingDir, 'lib', 'build.gradle'),
      `
    task androidSourcesJar(type: Jar) {
      classifier = 'sources'
      from android.sourceSets.main.java.srcDirs
      include '**/*.java'
    }
    
    artifacts {
        archives androidSourcesJar
    }
    apply from: 'jcenter-publish.gradle'
    `)

    fs.appendFileSync(path.join(workingDir, 'build.gradle'),
      `buildscript {
      dependencies {
          classpath 'com.jfrog.bintray.gradle:gradle-bintray-plugin:1.8.0'
      }
    }`)

    shell.cp(path.join(__dirname, 'supplements', 'jcenter-publish.gradle'), path.join(workingDir, 'lib'))
    mustacheUtils.mustacheRenderToOutputFileUsingTemplateFile(path.join(workingDir, 'lib', 'jcenter-publish.gradle'), mustacheConfig, path.join(workingDir, 'lib', 'jcenter-publish.gradle'))

    try {
      log.debug('[=== Starting build and jcenter publication ===]')
      shell.pushd(workingDir)
      await this.buildAndUploadArchive()
      log.debug('[=== Completed build and publication of the module ===]')
    } finally {
      shell.popd()
    }
  }
  async buildAndUploadArchive (): Promise < * > {
    const gradlew = /^win/.test(process.platform) ? 'gradlew' : './gradlew'
    await execp(`${gradlew} build`)
    return execp(`${gradlew} bintrayUpload`)
  }
}
