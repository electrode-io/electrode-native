import {exec} from 'child_process';
import platform from './platform';
import fs from 'fs';
import path from 'path'

export class ReactNativeCommands {
   get reactNativeBinaryPath() {
    return `${platform.currentPlatformVersionPath}/node_modules/.bin/react-native`;
  }

  async init(appName, rnVersion) {
    return new Promise((resolve, reject) => {
      const dir = path.join(process.cwd(), appName);

      if (fs.existsSync(dir)) {
        return reject(new Error(`Path already exists will not override ${dir}`));
      }

      exec(`${this.reactNativeBinaryPath} init ${appName} --version react-native@${rnVersion} --skip-jest`,
        (err, stdout, stderr) => {
          if (err) {
            return reject(err);
          }
          resolve(stdout);
        });
    });
  }

  async bundle({
    entryFile,
    dev,
    bundleOutput,
    assetsDest,
    platform
  }) {
    return new Promise((resolve, reject) => {
      exec(`${this.reactNativeBinaryPath} bundle \
        ${entryFile ? `--entry-file=${entryFile}` : ''} \
        ${dev ? '--dev=false' : '--dev=true'} \
        ${platform ? `--platform=${platform}` : ''} \
        ${bundleOutput ? `--bundle-output=${bundleOutput}` : ''} \
        ${assetsDest ? `--assets-dest=${assetsDest}` : ''}`,
          (err, stdout, stderr) => {
            if (err) {
              return reject(err);
            }
            if (stderr) {
              return reject(stderr);
            }
            if (stdout) {
              resolve(stdout);
            }
        });
    });
  }
}

export default new ReactNativeCommands();