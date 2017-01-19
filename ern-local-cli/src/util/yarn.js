import child_process from 'child_process';
const exec = child_process.exec;
import { logError } from './log.js';

// Yarn add a given dependency
export async function yarnAdd(dependency) {
  return new Promise((resolve, reject) => {
    exec(`yarn add ${dependency.name}@${dependency.version}`,
      (err, stdout, stderr) => {
      if (err) {
        logError(err);
        reject(err);
      } else {
        resolve(stdout);
      }
    });
  });
}
