import shell from './shell';
import os from 'os';

/**
 * Return the local machine ip returned by running
 * 'ipconfig getifaddr en0' command
 *
 * Only supported on Darwin and Linux
 * Will throw for Windows (implementation TBD if needed)
 */
export function getLocalIp() {
  if (os.platform() === 'win32') {
    throw new Error('getLocalIp: Unsupported platform win32');
  }
  const getIpCmd = shell.exec('ipconfig getifaddr en0');
  if (getIpCmd.stdout) {
    return getIpCmd.stdout.trim();
  } else {
    throw new Error(`[code: ${getIpCmd.code} stderr: ${getIpCmd.stderr}]`);
  }
}
