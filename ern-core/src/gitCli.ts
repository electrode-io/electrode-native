import simpleGit = require('simple-git/promise');
import log from './log';
import { LogLevel } from './coloredLog';

export function gitCli(workingDir?: string) {
  const simpleGitInstance = simpleGit(workingDir);
  simpleGitInstance.silent(log.level !== LogLevel.Trace);
  return simpleGitInstance;
}
