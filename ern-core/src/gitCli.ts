import simpleGit = require('simple-git/promise')
import log from './log'

export function gitCli(workingDir?: string) {
  const simpleGitInstance = simpleGit(workingDir)
  simpleGitInstance.silent(log.level !== 'trace')
  return simpleGitInstance
}
