import { ContainerPublisher, ContainerPublisherConfig } from '../types'
import { createTmpDir, shell, mustacheUtils, childProcess, log } from 'ern-core'
import fs from 'fs'
import path from 'path'
const { execp } = childProcess

export default class JcenterPublisher implements ContainerPublisher {
  public static readonly DEFAULT_ARTIFACT_ID: string = 'local-container'
  public static readonly DEFAULT_GROUP_ID: string = 'com.walmartlabs.ern'

  get name(): string {
    return 'jcenter'
  }

  public async publish(config: ContainerPublisherConfig): Promise<any> {
    if (!config.extra) {
      config.extra = {}
    }

    if (!config.extra.artifactId) {
      log.debug(
        `Using default artifactId: ${JcenterPublisher.DEFAULT_ARTIFACT_ID}`
      )
      config.extra.artifactId = JcenterPublisher.DEFAULT_ARTIFACT_ID
    }

    if (!config.extra.groupId) {
      log.debug(`Using default groupId: ${JcenterPublisher.DEFAULT_GROUP_ID}`)
      config.extra.groupId = JcenterPublisher.DEFAULT_GROUP_ID
    }

    const mustacheConfig: any = {}

    mustacheConfig.artifactId = config.extra.artifactId
    mustacheConfig.groupId = config.extra.groupId
    mustacheConfig.containerVersion = config.containerVersion

    fs.appendFileSync(
      path.join(config.containerPath, 'lib', 'build.gradle'),
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
      path.join(config.containerPath, 'build.gradle'),
      `buildscript {
      dependencies {
          classpath 'com.jfrog.bintray.gradle:gradle-bintray-plugin:1.8.0'
      }
    }`
    )

    shell.cp(
      path.join(__dirname, 'supplements', 'jcenter-publish.gradle'),
      path.join(config.containerPath, 'lib')
    )
    mustacheUtils.mustacheRenderToOutputFileUsingTemplateFile(
      path.join(config.containerPath, 'lib', 'jcenter-publish.gradle'),
      mustacheConfig,
      path.join(config.containerPath, 'lib', 'jcenter-publish.gradle')
    )

    try {
      log.info('[=== Starting build and jcenter publication ===]')
      shell.pushd(config.containerPath)
      await this.buildAndUploadArchive()
      log.info('[=== Completed build and publication of the Container ===]')
      log.info(
        `[Artifact: ${config.extra.groupId}:${config.extra.artifactId}:${
          config.containerVersion
        } ]`
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
