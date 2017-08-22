import {
  Utils
} from 'ern-util'

import fs from 'fs'
import shell from 'shelljs'

const HOME_DIRECTORY = process.env['HOME']
const FILE_REGEX = /^file:\/\//

export default class MavenUtils {
  static mavenRepositoryType (mavenRepositoryUrl: string): 'http' | 'file' | 'unknown' {
    if (mavenRepositoryUrl.startsWith('http')) {
      return 'http'
    } else if (mavenRepositoryUrl.startsWith('file')) {
      return 'file'
    }
    return 'unknown'
  }

  /**
   *  Build repository statement to be injected in Android build.gradle for publication target of generated container
   * @param mavenRepositoryUrl
   * @returns {string}
   */
  static targetRepositoryGradleStatement (mavenRepositoryUrl: string): ?string {
    const repoType = this.mavenRepositoryType(mavenRepositoryUrl)
    if (repoType === 'file') {
      return `repository(url: "${mavenRepositoryUrl}")`
    } else if (this.mavenRepositoryType === 'http') {
      return `repository(url: "${mavenRepositoryUrl}") { authentication(userName: mavenUser, password: mavenPassword) }`
    }
  }

  static getDefaultMavenLocalDirectory = () => {
    if (!HOME_DIRECTORY) {
      throw new Error(`process.env['HOME'] is undefined !!!`)
    }
    return `file://${HOME_DIRECTORY}/.m2/repository`
  }

  static isLocalMavenRepo (repoUrl: string): boolean {
    if (repoUrl && repoUrl === MavenUtils.getDefaultMavenLocalDirectory()) {
      return true
    }
    return false
  }

  static createLocalMavenDirectoryIfDoesNotExist () {
    const dir = MavenUtils.getDefaultMavenLocalDirectory().replace(FILE_REGEX, '')
    if (!fs.existsSync(dir)) {
      log.debug(`Local Maven repository folder does not exist, creating one.`)
      shell.mkdir('-p', dir)
      Utils.throwIfShellCommandFailed()
    } else {
      log.debug(`Local Maven repository folder already exists`)
    }
  }
}
