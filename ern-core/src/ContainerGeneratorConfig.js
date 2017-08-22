// @flow
import type { Publisher } from './Publisher'
import MavenPublisher from './MavenPublisher'
import GithubPublisher from './GithubPublisher'
import UnKnownPublisher from './UnKnownPublisher'
import MavenUtils from './MavenUtils'

/**
 * {
  "containerGenerator": {
    "mavenRepositoryUrl": "http://repo-url",
    "containerVersion": "1.0.0",
    "publishers": [
      {
        "name": "github",
        "url": "http://github"
      },
      {
        "name": "maven",
        "url": "http://nexus"
      }
    ]
  }
}
 */
export default class ContainerGeneratorConfig {
  publishers: Array<Publisher>
  containerVersion: string
  platform: string

  constructor (platform: string, config: any) {
    this.platform = platform
    if (config && config.containerVersion) {
      this.containerVersion = config.containerVersion
    }

    if (config) { // containerGenerator entry in JSON
      this.publishers = []
      if (!config.publishers && config.name && (config.mavenRepositoryUrl || config.targetRepoUrl)) {
        log.debug('cauldron still has old way of ContainerGeneratorConfig declaration. Trying to generate publishers using old schema type')
        this.publishers.push(ContainerGeneratorConfig.createPublisher(config.name, config.mavenRepositoryUrl ? config.mavenRepositoryUrl : config.targetRepoUrl))
      } else {
        log.debug('cauldron has new way of ContainerGeneratorConfig declaration. Trying to generate publishers')
        for (const p of config.publishers) {
          this.publishers.push(ContainerGeneratorConfig.createPublisher(p.name, p.url))
        }
      }
    } else if (platform === 'android') {
      // No container config provided. Lets create a default maven publisher for android
      this.publishers = []
      this.publishers.push(ContainerGeneratorConfig.createPublisher('maven', MavenUtils.getDefaultMavenLocalDirectory()))
    }
  }

  /**
   * Used to create publisher from a given name and url.
   */
  static createPublisher (name: string, url: string): Publisher {
    log.debug(`Creating publisher for ${name}:${url}`)
    switch (name) {
      case 'github': {
        return new GithubPublisher(url)
      }
      case 'maven' : {
        return new MavenPublisher({url})
      }
      default: {
        return new UnKnownPublisher()
      }
    }
  }

  shouldPublish (): boolean {
    return this.publishers && this.publishers.length > 0
  }

  /**
   * Returns the first github publisher available in the array
   */
  get firstAvailableGitHubPublisher (): ?Publisher {
    if (this.publishers) {
      for (const publisher of this.publishers) {
        if (publisher.name === 'github') {
          return publisher
        }
      }
    }
  }

  /**
   * Returns the first github publisher available in the array
   */
  get firstAvailableMavenPublisher (): ?Publisher {
    if (this.publishers) {
      for (const publisher of this.publishers) {
        if (publisher.name === 'maven') {
          return publisher
        }
      }
    }
  }
}
