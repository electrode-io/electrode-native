import {
  ContainerPublisher,
  ContainerPublisherConfig,
} from 'ern-container-publisher'
import {
  createTmpDir,
  shell,
  mustacheUtils,
  childProcess,
  log,
  NativePlatform,
} from 'ern-core'
import fs from 'fs'
import path from 'path'
const { execp } = childProcess

export default class JcenterPublisher implements ContainerPublisher {
  get name(): string {
    return 'jcenter'
  }

  get platforms(): NativePlatform[] {
    return ['android']
  }

  public async publish({
    containerPath,
    containerVersion,
    extra,
  }: {
    containerPath: string
    containerVersion: string
    extra?: {
      artifactId?: string
      groupId?: string
    }
  }): Promise<any> {
    if (!extra) {
      throw new Error('artifactId, groupId must be provided to this publisher')
    }

    if (!extra.artifactId) {
      throw new Error('artifactId must be provided to this publisher')
    }

    if (!extra.groupId) {
      throw new Error('groupId must be provided to this publisher')
    }

    const mustacheConfig: any = {}

    mustacheConfig.artifactId = extra.artifactId
    mustacheConfig.groupId = extra.groupId
    mustacheConfig.containerVersion = containerVersion

    fs.appendFileSync(
      path.join(containerPath, 'lib', 'build.gradle'),
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
    `
    )

    fs.appendFileSync(
      path.join(containerPath, 'build.gradle'),
      `buildscript {
      dependencies {
          classpath 'com.jfrog.bintray.gradle:gradle-bintray-plugin:1.8.0'
      }
    }`
    )

    shell.cp(
      path.join(__dirname, 'supplements', 'jcenter-publish.gradle'),
      path.join(containerPath, 'lib')
    )
    mustacheUtils.mustacheRenderToOutputFileUsingTemplateFile(
      path.join(containerPath, 'lib', 'jcenter-publish.gradle'),
      mustacheConfig,
      path.join(containerPath, 'lib', 'jcenter-publish.gradle')
    )

    try {
      log.info('[=== Starting build and jcenter publication ===]')
      shell.pushd(containerPath)
      await this.buildAndUploadArchive()
      log.info('[=== Completed build and publication of the Container ===]')
      log.info(
        `[Artifact: ${extra.groupId}:${extra.artifactId}:${containerVersion} ]`
      )
    } finally {
      shell.popd()
    }
  }

  public async buildAndUploadArchive(): Promise<any> {
    const gradlew = /^win/.test(process.platform) ? 'gradlew' : './gradlew'
    await execp(`${gradlew} build`)
    return execp(`${gradlew} bintrayUpload`)
  }
}
