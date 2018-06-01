import {
  ContainerPublisher,
  ContainerPublisherConfig,
} from 'ern-container-publisher'
import { MavenUtils, shell, childProcess, log, NativePlatform } from 'ern-core'
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

  get platforms(): NativePlatform[] {
    return ['android']
  }

  public async publish({
    containerPath,
    containerVersion,
    url,
    extra,
  }: {
    containerPath: string
    containerVersion: string
    url?: string
    extra?: {
      artifactId?: string
      groupId?: string
      mavenPassword?: string
      mavenUser?: string
    }
  }): Promise<any> {
    if (!extra) {
      extra = {}
    }

    if (!extra.artifactId) {
      log.debug(
        `Using default artifactId: ${MavenPublisher.DEFAULT_ARTIFACT_ID}`
      )
      extra.artifactId = MavenPublisher.DEFAULT_ARTIFACT_ID
    }

    if (!extra.groupId) {
      log.debug(`Using default groupId: ${MavenPublisher.DEFAULT_GROUP_ID}`)
      extra.groupId = MavenPublisher.DEFAULT_GROUP_ID
    }

    if (!url) {
      log.debug(`Using default url: ${MavenPublisher.DEFAULT_URL}`)
      url = MavenPublisher.DEFAULT_URL
    }

    if (MavenUtils.isLocalMavenRepo(url)) {
      MavenUtils.createLocalMavenDirectoryIfDoesNotExist()
    }

    url = url.replace('file:~', `file:${os.homedir() || ''}`)

    fs.appendFileSync(
      path.join(containerPath, 'lib', 'build.gradle'),
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
              pom.version = '${containerVersion}'
              pom.artifactId = '${extra.artifactId}'
              pom.groupId = '${extra.groupId}'
              ${MavenUtils.targetRepositoryGradleStatement(url, {
                mavenPassword: extra && extra.mavenPassword,
                mavenUser: extra && extra.mavenUser,
              })}
          }
      }
  }
  `
    )

    try {
      log.info('[=== Starting build and publication ===]')
      shell.pushd(containerPath)
      await this.buildAndUploadArchive()
      log.info('[=== Completed build and publication of the Container ===]')
      log.info(`[Publication url : ${url}]`)
      log.info(
        `[Artifact: ${extra.groupId}:${extra.artifactId}:${containerVersion} ]`
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
