import child_process from 'child_process';
const exec = child_process.exec;
const execSync = child_process.execSync;
const log = require('console-log-level')();
import tagOneLine from './tagoneline.js';

// Yarn add a given dependency
export async function yarnAdd(dependency, { dev } = {}) {
  return new Promise((resolve, reject) => {
    exec(tagOneLine`yarn add ${dependency.scope ? `@${dependency.scope}/` : ``}
                    ${dependency.name}@${dependency.version} --exact
                    ${dev ? '--dev' : ''}`,
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

export async function yarnInstall() {
  return new Promise((resolve, reject) => {
    exec(`yarn install`,
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
