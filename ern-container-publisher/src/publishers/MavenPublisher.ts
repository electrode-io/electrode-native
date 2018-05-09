import { ContainerPublisher, ContainerPublisherConfig } from '../types'
import { MavenUtils, shell, childProcess, log } from 'ern-core'
import fs from 'fs'
import path from 'path'
import os from 'os'
const { execp } = childProcess

export default class MavenPublisher implements ContainerPublisher {
  public static readonly DEFAULT_ARTIFACT_ID: string = 'local-container'
  public static readonly DEFAULT_GROUP_ID: string = 'com.walmartlabs.ern'
  public static readonly DEFAULT_URL: string = `file:${path.join(
    os.homedir() || '',
    '.m2',
    'repository'
  )}`

  get name(): string {
    return 'maven'
  }

  public async publish(config: ContainerPublisherConfig): Promise<any> {
    if (!config.extra) {
      config.extra = {}
    }

    if (!config.extra.artifactId) {
      log.debug(
        `Using default artifactId: ${MavenPublisher.DEFAULT_ARTIFACT_ID}`
      )
      config.extra.artifactId = MavenPublisher.DEFAULT_ARTIFACT_ID
    }

    if (!config.extra.groupId) {
      log.debug(`Using default groupId: ${MavenPublisher.DEFAULT_GROUP_ID}`)
      config.extra.groupId = MavenPublisher.DEFAULT_GROUP_ID
    }

    if (!config.url) {
      log.debug(`Using default url: ${MavenPublisher.DEFAULT_URL}`)
      config.url = MavenPublisher.DEFAULT_URL
    }

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
              pom.artifactId = '${config.extra.artifactId}'
              pom.groupId = '${config.extra.groupId}'
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
      log.info('[=== Starting build and publication ===]')
      shell.pushd(config.containerPath)
      await this.buildAndUploadArchive()
      log.info('[=== Completed build and publication of the Container ===]')
      log.info(`[Publication url : ${config.url}]`)
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
    return execp(`${gradlew} lib:uploadArchives`)
  }
}
