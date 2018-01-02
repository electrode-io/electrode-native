import shell from './shell'
import {httpGet} from './utils'
import fs from 'fs'
import os from 'os'
import path from 'path'

const HOME_DIRECTORY = os.homedir()
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
      // Replace \ by \\ for Windows
      return `repository(url: "${mavenRepositoryUrl.replace(/\\/g, '\\\\')}")`
    } else if (repoType === 'http') {
      return `repository(url: "${mavenRepositoryUrl}") { authentication(userName: mavenUser, password: mavenPassword) }`
    }
  }

  static getDefaultMavenLocalDirectory = () => {
    const pathToRepository = path.join(HOME_DIRECTORY, '.m2', 'repository')
    return `file://${pathToRepository}`
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
      log.debug(`Local Maven repository directory does not exist, creating one.`)
      shell.mkdir('-p', dir)
    } else {
      log.debug(`Local Maven repository directory already exists`)
    }
  }

  // Not used for now, but kept here. Might need it
  static async isArtifactInMavenRepo (artifactDescriptor: string, mavenRepoUrl: string): Promise<?boolean> {
    // An artifact follows the format group:name:version
    // i.e com.walmartlabs.ern:react-native-electrode-bridge:1.0.0
    // Split it !
    const explodedArtifactDescriptor = artifactDescriptor.split(':')
    // We replace all '.' in the group with `/`
    // i.e: com.walmartlabs.ern => com/walmartlabs/ern
    // As it corresponds to the path where artifact is stored
    explodedArtifactDescriptor[0] = explodedArtifactDescriptor[0].replace(/[.]/g, '/')
    // And we join everything together to get full path in the repository
    // i.e: com.walmartlabs.ern:react-native-electrode-bridge:1.0.0
    // => com/walmartlabs/ern/react-native-electrode-bridge/1.0.0
    const pathToArtifactInRepository = explodedArtifactDescriptor.join('/')

    const mavenRepoType = this.mavenRepositoryType(mavenRepoUrl)
    // Remote maven repo
    // Just do an HTTP GET to the url of the artifact.
    // If it returns '200' status code, it means the artifact exists, otherwise
    // it doesn't
    if (mavenRepoType === 'http') {
      // Last `/` is important here, otherwise we'll get an HTTP 302 instead of 200
      // in case the artifact does exists !
      const res = await httpGet(`${mavenRepoUrl}/${pathToArtifactInRepository}/`)
      return res.statusCode === 200
    } else if (mavenRepoType === 'file') {
      const mavenRepositoryPath = mavenRepoUrl.replace('file://', '')
      return fs.existsSync(`${mavenRepositoryPath}/${pathToArtifactInRepository}`)
    }
  }
}
