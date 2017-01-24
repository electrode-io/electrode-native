import child_process from 'child_process';
const exec = child_process.exec;
const execSync = child_process.execSync;
const log = require('console-log-level')();

// Yarn add a given dependency
export async function yarnAdd(dependency) {
  return new Promise((resolve, reject) => {
    exec(`yarn add ${dependency.scope ? `@${dependency.scope}/` : ``}${dependency.name}@${dependency.version} --exact`,
      (err, stdout, stderr) => {
      if (err) {
        log.error(err);
        reject(err);
      } else {
        resolve(stdout);
      }
    });
  });
}

export function isYarnInstalled() {
  try {
    execSync('yarn --version')
    return true;
  } catch (e) {
    return false;
  }
}
