import os from 'os'
import path from 'path'

export function getDefaultMavenLocalDirectory() {
  const pathToRepository = path.join(os.homedir(), '.m2/repository')
  return `file://${pathToRepository}`
}
