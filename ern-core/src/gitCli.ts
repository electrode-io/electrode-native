import simpleGit = require('simple-git')
import Prom from 'bluebird'
import log from './log'

export function gitCli(workingDir?: string) {
  const simpleGitInstance = simpleGit(workingDir)
  simpleGitInstance.silent(log.level !== 'trace')
  return Prom.promisifyAll(simpleGitInstance)
}
