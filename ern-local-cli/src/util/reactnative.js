import child_process from 'child_process';

const exec = child_process.exec;
const log = require('console-log-level')();

export async function reactNativeInit(appName, rnVersion) {
  return new Promise((resolve, reject) => {
    exec(`react-native init ${appName} --version react-native@${rnVersion}`,
      (err, stdout, stderr) => {
      if (err) {
        log.error(err);
        reject(err);
      } else if (stdout) {
        resolve(stdout);
      }
    });
  });
}
