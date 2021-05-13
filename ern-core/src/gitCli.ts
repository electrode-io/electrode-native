import simpleGit = require('simple-git/promise');

export function gitCli(workingDir?: string) {
  return simpleGit(workingDir);
}
