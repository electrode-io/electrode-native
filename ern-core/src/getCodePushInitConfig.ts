import fs from 'fs';
import path from 'path';
import config from './config';
import { CodePushInitConfig } from './CodePushSdk';

export function getCodePushInitConfig(): CodePushInitConfig {
  const codePushConfigFilePath = path.join(
    process.env.LOCALAPPDATA || process.env.HOME || '',
    '.code-push.config',
  );
  let codePushInitConfig: CodePushInitConfig;
  if (fs.existsSync(codePushConfigFilePath)) {
    codePushInitConfig = JSON.parse(
      fs.readFileSync(codePushConfigFilePath, 'utf-8'),
    );
  } else {
    codePushInitConfig = {
      accessKey: config.get('codePushAccessKey'),
      customHeaders: config.get('codePushCustomHeaders'),
      customServerUrl: config.get('codePushCustomServerUrl'),
      proxy: config.get('codePushProxy'),
    };
  }
  return codePushInitConfig;
}
