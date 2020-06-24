import { getCodePushInitConfig } from './getCodePushInitConfig';
import CodePushSdk from './CodePushSdk';

export function getCodePushSdk() {
  const codePushInitConfig = getCodePushInitConfig();
  if (!codePushInitConfig || !codePushInitConfig.accessKey) {
    throw new Error('Unable to get the CodePush config to use');
  }
  return new CodePushSdk(codePushInitConfig);
}
