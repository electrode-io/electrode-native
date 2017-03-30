import {exec} from 'child_process';
import platform from './platform';
import fs from 'fs';
import path from 'path'

export class CodePushCommands {
   get codePushBinaryPath() {
    return `${platform.currentPlatformVersionPath}/node_modules/.bin/code-push`;
  }

  async releaseReact(appName, platform, {
    targetBinaryVersion,
    mandatory,
    deploymentName
  }) {
    return new Promise((resolve, reject) => {
      exec(`${this.codePushBinaryPath} release-react \
        ${appName} \
        ${platform} \
        ${targetBinaryVersion ? `-t ${targetBinaryVersion}` : ''} \
        ${mandatory ? `-m` : ''} \
        ${deploymentName ? `-d ${deploymentName}` : ''}`,
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

export default new CodePushCommands();