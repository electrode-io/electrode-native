import { ContainerPublisher, ContainerPublisherConfig } from '../FlowTypes'
import { MavenUtils, shell, childProcess, log } from 'ern-core'
import fs from 'fs'
import path from 'path'
import os from 'os'
const { execp } = childProcess

export default class MavenPublisher implements ContainerPublisher {
  get name(): string {
    return 'maven'
  }

  public async publish(config: ContainerPublisherConfig): Promise<any> {
    if (!config.extra) {
      config.extra = {}
    }

    if (!config.extra.artifactId) {
      config.extra.artifactId = 'local-container'
    }

    if (!config.extra.groupId) {
      config.extra.groupId = 'com.walmartlabs.ern'
    }

    const artifactId = config.extra.artifactId
    const groupId = config.extra.groupId

    if (MavenUtils.isLocalMavenRepo(config.url)) {
      MavenUtils.createLocalMavenDirectoryIfDoesNotExist()
    }

    config.url = config.url.replace('file:~', `file:${os.homedir() || ''}`)

    fs.appendFileSync(
      path.join(config.containerPath, 'lib', 'build.gradle'),
      `
  apply plugin: 'maven'
  
  task androidSourcesJar(type: Jar) {
      classifier = 'sources'
      from android.sourceSets.main.java.srcDirs
      include '**/*.java'
  }
  
  artifacts {
      archives androidSourcesJar
  }
  
  uploadArchives {
      repositories {
          mavenDeployer {
              pom.version = '${config.containerVersion}'
              pom.artifactId = '${artifactId}'
              pom.groupId = '${groupId}'
              ${MavenUtils.targetRepositoryGradleStatement(config.url, {
                mavenPassword: config.extra && config.extra.mavenPassword,
                mavenUser: config.extra && config.extra.mavenUser,
              })}
          }
      }
  }
  `
    )

    try {
      log.debug('[=== Starting build and publication ===]')
      shell.pushd(config.containerPath)
      await this.buildAndUploadArchive()
      log.debug('[=== Completed build and publication of the module ===]')
    } finally {
      shell.popd()
    }
  }

  public async buildAndUploadArchive(): Promise<any> {
    const gradlew = /^win/.test(process.platform) ? 'gradlew' : './gradlew'
    return execp(`${gradlew} lib:uploadArchives`)
  }
}
